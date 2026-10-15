<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Camera;
use App\Models\CollectionSuggestion;
use App\Models\Employee;
use App\Models\License;
use App\Models\Loan;
use App\Models\Member;
use App\Models\NewPublication;
use App\Models\OpnameCheck;
use App\Models\OpnameSession;
use App\Models\OvertimeSession;
use App\Models\ProcurementItem;
use App\Models\Publisher;
use App\Models\Rack;
use App\Models\Room;
use App\Models\User;
use App\Support\LibrarySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    use RefreshDatabase;

    private User $pustakawan;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-15 09:00:00');
        $this->pustakawan = User::factory()->pustakawan()->create();
        $this->actingAs($this->pustakawan);
    }

    private function book(int $copies = 3, string $title = 'Hukum Agraria Indonesia', ?Rack $rack = null): Book
    {
        $book = Book::create([
            'type' => Book::PRINTED, 'title' => $title, 'author_id' => Author::idForName('Boedi Harsono'),
            'publisher_id' => Publisher::idForName('Djambatan'), 'ddc_class' => '300', 'collection_type' => 'Buku teks',
            'call_number' => '346.04 HAR h', 'rack_id' => ($rack ?? Rack::firstOrCreate(['code' => 'B3'], ['name' => 'Hukum', 'floor' => 1]))->id,
        ]);
        $book->syncCopyCount($copies);

        return $book;
    }

    private function room(array $attributes = []): Room
    {
        return Room::create([
            'floor' => 2, 'name' => 'Rak buku', 'type' => 'koleksi', 'area_m2' => 72,
            'map_x' => 0, 'map_y' => 0, 'map_w' => 18, 'map_h' => 100, ...$attributes,
        ]);
    }

    // Ruang & inventaris

    public function test_room_kpis_count_only_library_floors()
    {
        LibrarySettings::save(['sivitas' => 100]);
        $this->room(['type' => 'koleksi', 'area_m2' => 30]);
        $this->room(['name' => 'Ruang baca', 'type' => 'baca', 'area_m2' => 30]);
        $this->room(['floor' => 1, 'name' => 'Ruang dosen', 'type' => 'kerja', 'area_m2' => 500, 'outside_library' => true]);

        $this->get('/staf/aset/ruang')->assertInertia(fn (Assert $page) => $page
            ->component('staf/aset/ruang')
            ->where('kpis.area', 60)
            ->where('kpis.perSivitas', 0.6)
            ->where('kpis.basic', 2));
    }

    public function test_room_area_and_type_can_be_edited_but_not_for_stairs()
    {
        $room = $this->room();
        $this->put("/staf/aset/ruang/{$room->id}", ['area_m2' => 80.5, 'type' => 'baca'])->assertSessionHas('success');
        $this->assertSame(80.5, $room->fresh()->area_m2);

        $stairs = $this->room(['name' => 'Tangga', 'type' => 'non']);
        $this->put("/staf/aset/ruang/{$stairs->id}", ['area_m2' => 1, 'type' => 'baca'])->assertStatus(409);
    }

    public function test_assets_are_recorded_and_updated_inline()
    {
        $room = $this->room();

        $this->post('/staf/aset/inventaris/aset', [
            'name' => 'Meja baca individu', 'category' => 'Perabot', 'function' => 'Membaca', 'room_id' => $room->id,
            'quantity' => 12, 'condition' => 'Baik',
        ])->assertSessionHasNoErrors();

        $asset = Asset::sole();
        $this->patch("/staf/aset/inventaris/aset/{$asset->id}", ['condition' => 'Rusak ringan']);
        $this->patch("/staf/aset/inventaris/aset/{$asset->id}", ['quantity' => 0])->assertSessionHasErrors('quantity');

        $this->assertSame('Rusak ringan', $asset->fresh()->condition);
        $this->assertSame(12, $asset->fresh()->quantity);
    }

    public function test_missing_public_facilities_are_flagged_and_can_be_added()
    {
        $this->room(['name' => 'Lobi & mesin presensi', 'type' => 'pendukung']);

        $this->get('/staf/aset/inventaris')->assertInertia(fn (Assert $page) => $page->where('missingFacilities', Asset::REQUIRED_FACILITIES));

        $this->post('/staf/aset/inventaris/fasilitas', ['function' => 'Ruang laktasi'])->assertSessionHas('success');
        $this->get('/staf/aset/inventaris')->assertInertia(fn (Assert $page) => $page->has('missingFacilities', 6));
    }

    public function test_license_status_can_be_changed()
    {
        $this->post('/staf/aset/inventaris/lisensi', ['name' => 'CorelDRAW', 'usage' => 'Poster', 'seats' => 1, 'status' => 'Tidak berlisensi']);
        $license = License::sole();

        $this->patch("/staf/aset/inventaris/lisensi/{$license->id}", ['status' => 'Berlisensi']);

        $this->assertSame('Berlisensi', $license->fresh()->status);
        $this->get('/staf/aset/inventaris?kategori=Lisensi')->assertInertia(fn (Assert $page) => $page->has('licenses', 1)->has('assets', 0));
    }

    // Stock opname

    public function test_opname_records_results_and_applies_them_when_finished()
    {
        $book = $this->book(4);
        [$found, $damaged, $missing, $loaned] = $book->copies()->orderBy('id')->get();
        $loaned->update(['status' => BookCopy::LOANED]);

        $this->post('/staf/opname/mulai', ['name' => 'Opname ganjil'])->assertSessionHas('success');
        $this->post('/staf/opname/cek', ['code' => strtolower($found->code)])->assertSessionHasNoErrors();
        $this->post('/staf/opname/cek', ['code' => $damaged->code, 'result' => 'rusak']);
        $this->post('/staf/opname/cek', ['code' => $missing->code, 'result' => 'hilang']);
        $this->post('/staf/opname/cek', ['code' => $loaned->code])->assertSessionHasErrors('code');
        $this->post('/staf/opname/cek', ['code' => 'B9999-9'])->assertSessionHasErrors('code');

        $this->get('/staf/opname?rak=B3')->assertInertia(fn (Assert $page) => $page
            ->where('session.progress', ['total' => 3, 'done' => 3])
            ->where('session.rack.summary.dipinjam', 1));

        $this->post('/staf/opname/selesai')->assertSessionHas('success');

        $this->assertSame(BookCopy::AVAILABLE, $found->fresh()->status);
        $this->assertSame(BookCopy::REPAIR, $damaged->fresh()->status);
        $this->assertSame(BookCopy::LOST, $missing->fresh()->status);
        $this->assertSame(BookCopy::LOANED, $loaned->fresh()->status);
        $this->assertNull(OpnameSession::active());
    }

    public function test_only_one_opname_session_runs_at_a_time()
    {
        $this->post('/staf/opname/mulai', ['name' => 'A']);
        $this->post('/staf/opname/mulai', ['name' => 'B'])->assertStatus(409);
        $this->assertSame(1, OpnameSession::count());
    }

    public function test_a_lost_copy_found_again_returns_to_the_shelf()
    {
        $copy = $this->book(1)->copies()->first();
        $copy->update(['status' => BookCopy::LOST]);

        $this->post('/staf/opname/mulai', ['name' => 'A']);
        $this->post('/staf/opname/cek', ['code' => $copy->code]);
        $this->post('/staf/opname/selesai');

        $this->assertSame(BookCopy::AVAILABLE, $copy->fresh()->status);
        $this->assertSame(OpnameCheck::FOUND, OpnameCheck::sole()->result);
    }

    // Pengadaan

    public function test_favorites_come_from_loans_in_the_last_six_months()
    {
        $book = $this->book(2, 'Laskar Pelangi');
        $member = Member::create(['member_number' => '1', 'name' => 'A', 'type' => 'Mahasiswa']);
        $copy = $book->copies()->first();

        foreach (range(1, 11) as $i) {
            Loan::create(['book_copy_id' => $copy->id, 'member_id' => $member->id, 'loaned_at' => now()->subDays($i * 10), 'due_at' => today(), 'returned_at' => now()]);
        }
        // Too old to count.
        Loan::create(['book_copy_id' => $copy->id, 'member_id' => $member->id, 'loaned_at' => now()->subYear(), 'due_at' => today(), 'returned_at' => now()]);

        $this->get('/staf/pengadaan?tab=favorit')->assertInertia(fn (Assert $page) => $page
            ->has('favorites', 1)
            ->where('favorites.0.loans', 11)
            ->where('favorites.0.ratio', 5.5)
            ->where('favorites.0.add', 1));
    }

    public function test_suggestion_flow_from_approval_to_order()
    {
        $suggestion = CollectionSuggestion::create(['title' => 'QGIS untuk Pemula', 'author' => 'Agus Purwanto']);

        $this->post("/staf/pengadaan/usulan/{$suggestion->id}/setujui")->assertSessionHas('success');
        $this->assertSame(CollectionSuggestion::APPROVED, $suggestion->fresh()->status);
        $this->assertSame(2, ProcurementItem::draft()->sole()->quantity);

        $this->post('/staf/pengadaan/ajukan')->assertSessionHas('success');
        $this->assertSame(CollectionSuggestion::ORDERED, $suggestion->fresh()->status);
        $this->assertSame(0, ProcurementItem::draft()->count());

        $this->post("/staf/pengadaan/usulan/{$suggestion->id}/tiba");
        $this->assertSame(CollectionSuggestion::AVAILABLE, $suggestion->fresh()->status);
    }

    public function test_undoing_an_approval_removes_the_draft_item()
    {
        $suggestion = CollectionSuggestion::create(['title' => 'X', 'author' => 'Y']);
        $this->post("/staf/pengadaan/usulan/{$suggestion->id}/setujui");

        $this->post("/staf/pengadaan/usulan/{$suggestion->id}/batal");

        $this->assertSame(CollectionSuggestion::PROPOSED, $suggestion->fresh()->status);
        $this->assertSame(0, ProcurementItem::count());
    }

    public function test_list_over_budget_cannot_be_submitted()
    {
        LibrarySettings::save(['procurement_budget' => 200000]);
        $publication = NewPublication::create(['title' => 'Kadaster Multiguna', 'author' => 'Randy', 'publisher' => 'STPN Press', 'year' => 2026, 'ddc_class' => '300', 'price' => 125000, 'reason' => 'Baru']);

        $this->post("/staf/pengadaan/terbitan/{$publication->id}");
        $item = ProcurementItem::sole();
        $this->patch("/staf/pengadaan/daftar/{$item->id}", ['quantity' => 2]);

        $this->post('/staf/pengadaan/ajukan')->assertSessionHas('error');
        $this->assertNull($item->fresh()->submitted_at);

        $this->get('/staf/pengadaan?tab=daftar')->assertInertia(fn (Assert $page) => $page->where('list.total', 250000)->where('list.budget', 200000));
    }

    public function test_submitted_items_are_locked_and_new_additions_start_a_new_draft()
    {
        $publication = NewPublication::create(['title' => 'A', 'author' => 'B', 'publisher' => 'C', 'year' => 2026, 'ddc_class' => '300', 'price' => 100000, 'reason' => 'R']);
        $other = NewPublication::create(['title' => 'D', 'author' => 'E', 'publisher' => 'F', 'year' => 2026, 'ddc_class' => '300', 'price' => 100000, 'reason' => 'R']);

        $this->post("/staf/pengadaan/terbitan/{$publication->id}");
        $this->post('/staf/pengadaan/ajukan');
        $submitted = ProcurementItem::sole();

        $this->patch("/staf/pengadaan/daftar/{$submitted->id}", ['quantity' => 5])->assertStatus(409);
        $this->post("/staf/pengadaan/terbitan/{$other->id}");

        $this->assertSame(1, ProcurementItem::draft()->count());
    }

    // Kegiatan harian

    public function test_staff_log_their_own_activities()
    {
        $employee = Employee::create(['kind' => 'pustakawan', 'nip' => '196807251991031002', 'name' => 'Yosep', 'golongan' => 'IV/a', 'position' => 'Pustakawan Ahli Madya', 'user_id' => $this->pustakawan->id]);

        $this->post('/staf/kegiatan', [
            'date' => '2026-10-15', 'starts_at' => '08:00', 'ends_at' => '10:30', 'category' => 'Layanan sirkulasi',
            'description' => 'Melayani peminjaman', 'status' => 'Selesai',
        ])->assertSessionHas('success');

        $this->post('/staf/kegiatan', [
            'date' => '2026-10-15', 'starts_at' => '10:00', 'ends_at' => '09:00', 'category' => 'Lainnya', 'description' => 'x', 'status' => 'Selesai',
        ])->assertSessionHasErrors('ends_at');
        $this->post('/staf/kegiatan', [
            'date' => '2026-10-20', 'starts_at' => '08:00', 'ends_at' => '09:00', 'category' => 'Lainnya', 'description' => 'x', 'status' => 'Selesai',
        ])->assertSessionHasErrors('date');

        $this->assertSame($employee->id, ActivityLog::sole()->employee_id);
        $this->get('/staf/kegiatan')->assertInertia(fn (Assert $page) => $page->where('kpis.count', 1)->where('kpis.minutes', 150));
    }

    public function test_staff_without_an_employee_record_cannot_log()
    {
        $this->post('/staf/kegiatan', ['date' => '2026-10-15', 'starts_at' => '08:00', 'ends_at' => '09:00', 'category' => 'Lainnya', 'description' => 'x', 'status' => 'Selesai'])
            ->assertForbidden();
    }

    public function test_admin_sees_the_monthly_recap_for_everyone()
    {
        $this->actingAs(User::factory()->admin()->create());
        $a = Employee::create(['kind' => 'tendik', 'nip' => '197211252006042018', 'name' => 'Sujilah', 'golongan' => 'III/c', 'position' => 'Penata']);
        ActivityLog::create(['employee_id' => $a->id, 'date' => '2026-10-14', 'starts_at' => '08:00', 'ends_at' => '10:00', 'category' => 'Administrasi', 'description' => 'x']);
        ActivityLog::create(['employee_id' => $a->id, 'date' => '2026-10-15', 'starts_at' => '08:00', 'ends_at' => '09:00', 'category' => 'Administrasi', 'description' => 'y']);

        $this->get('/staf/kegiatan?tab=rekap')->assertInertia(fn (Assert $page) => $page
            ->where('recap.0.days', 2)
            ->where('recap.0.minutes', 180)
            ->where('recap.0.top', 'Administrasi'));
    }

    // Lembur

    public function test_only_admins_schedule_overtime()
    {
        $employee = Employee::create(['kind' => 'tendik', 'nip' => '198603102008041001', 'name' => 'Irfan', 'golongan' => 'III/c', 'position' => 'Penata']);
        $payload = ['activity' => 'Layanan ruang baca', 'date' => '2026-10-15', 'starts_at' => '16:00', 'ends_at' => '21:00', 'employees' => [$employee->id]];

        $this->post('/staf/lembur', $payload)->assertForbidden();

        $this->actingAs(User::factory()->admin()->create())->post('/staf/lembur', $payload)->assertSessionHas('success');
        $this->assertSame(1, OvertimeSession::sole()->assignments()->count());
    }

    public function test_overtime_presence_by_the_assigned_staff_within_the_window()
    {
        $mine = Employee::create(['kind' => 'pustakawan', 'nip' => '196905121991031005', 'name' => 'Martinho', 'golongan' => 'III/d', 'position' => 'Pustakawan Ahli Muda', 'user_id' => $this->pustakawan->id]);
        $other = Employee::create(['kind' => 'tendik', 'nip' => '198603102008041001', 'name' => 'Irfan', 'golongan' => 'III/c', 'position' => 'Penata']);
        $session = OvertimeSession::create(['date' => '2026-10-15', 'starts_at' => '16:00', 'ends_at' => '21:00', 'activity' => 'Layanan']);
        $assignment = $session->assignments()->create(['employee_id' => $mine->id]);
        $someoneElse = $session->assignments()->create(['employee_id' => $other->id]);

        $this->post("/staf/lembur/{$someoneElse->id}/masuk")->assertForbidden();
        $this->post("/staf/lembur/{$assignment->id}/masuk")->assertSessionHas('error'); // 09.00, too early

        Carbon::setTestNow('2026-10-15 16:20:00');
        $this->post("/staf/lembur/{$assignment->id}/masuk")->assertSessionHas('success');
        Carbon::setTestNow('2026-10-15 21:05:00');
        $this->post("/staf/lembur/{$assignment->id}/keluar")->assertSessionHas('success');

        $assignment->refresh();
        $this->assertTrue($assignment->isLate());
        $this->assertSame(285, $assignment->minutes());
    }

    public function test_overtime_letter_is_a_pdf()
    {
        OvertimeSession::create(['date' => '2026-10-10', 'starts_at' => '16:00', 'ends_at' => '21:00', 'activity' => 'Layanan']);

        $this->get('/staf/lembur/surat')->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    // CCTV

    public function test_cameras_can_be_toggled_and_events_logged()
    {
        $camera = Camera::create(['code' => 'CAM-01', 'name' => 'Loket', 'floor' => 2, 'area' => 'Sirkulasi']);

        $this->post("/staf/cctv/{$camera->id}/rekam");
        $this->assertFalse($camera->fresh()->recording);

        $this->post("/staf/cctv/{$camera->id}/sambungan");
        $this->assertFalse($camera->fresh()->online);
        $this->post("/staf/cctv/{$camera->id}/rekam")->assertStatus(409);

        $this->post('/staf/cctv/kejadian', ['camera_id' => $camera->id, 'kind' => 'Antrean', 'description' => 'Antrean panjang']);

        $this->get('/staf/cctv')->assertInertia(fn (Assert $page) => $page->has('events', 3)->where('summary.online', 0));
    }

    public function test_only_admins_set_the_stream_url_and_it_must_be_http()
    {
        $camera = Camera::create(['code' => 'CAM-01', 'name' => 'Loket', 'floor' => 2, 'area' => 'Sirkulasi']);
        $payload = ['name' => 'Loket', 'floor' => 2, 'area' => 'Sirkulasi', 'stream_url' => 'javascript:alert(1)'];

        $this->put("/staf/cctv/{$camera->id}", $payload)->assertForbidden();

        $this->actingAs(User::factory()->admin()->create());
        $this->put("/staf/cctv/{$camera->id}", $payload)->assertSessionHasErrors('stream_url');
        $this->put("/staf/cctv/{$camera->id}", [...$payload, 'stream_url' => 'http://192.168.1.20/snapshot.jpg'])->assertSessionHasNoErrors();
    }
}
