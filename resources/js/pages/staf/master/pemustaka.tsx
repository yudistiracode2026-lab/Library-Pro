import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';

interface MemberRow {
    id: number;
    member_number: string;
    name: string;
    type: string;
    study_program: string | null;
    email: string | null;
    status: string;
    has_account: boolean;
    open_loans: number;
}

interface PemustakaProps {
    records: Paginated<MemberRow>;
    filters: { q: string; urut?: string; arah?: string };
    options: { types: SelectOption[]; studyPrograms: SelectOption[]; statuses: SelectOption[] };
}

export default function Pemustaka({ records, filters, options }: PemustakaProps) {
    return (
        <StafLayout title="Master pemustaka" group="Master data">
            <MasterPage<MemberRow>
                routeKey="pemustaka"
                heading="Data pemustaka"
                description="Mahasiswa, dosen, dan anggota luar yang terdaftar"
                addLabel="Tambah pemustaka"
                records={records}
                filters={filters}
                numbered
                grid="minmax(0,1.8fr) 130px minmax(0,1.2fr) 100px 90px 100px"
                describeRow={(m) => m.name}
                columns={[
                    {
                        label: 'Nama',
                        sort: 'nama',
                        render: (m) => (
                            <Cell bold sub={m.email}>
                                {m.name}
                            </Cell>
                        ),
                    },
                    { label: 'NIM / NIP', sort: 'nim', render: (m) => <Cell mono>{m.member_number}</Cell> },
                    { label: 'Program studi', sort: 'prodi', render: (m) => <Cell>{m.study_program}</Cell> },
                    { label: 'Jenis', sort: 'jenis', render: (m) => <Cell>{m.type}</Cell> },
                    { label: 'Pinjaman', sort: 'pinjaman', render: (m) => <Cell>{`${m.open_loans} aktif`}</Cell> },
                    { label: 'Status', sort: 'status', render: (m) => <StatusBadge status={m.status} /> },
                ]}
                form={{
                    title: (m) => (m ? 'Ubah pemustaka' : 'Tambah pemustaka'),
                    empty: { name: '', member_number: '', study_program: 'D4 Pertanahan', type: 'Mahasiswa', email: '', status: 'Aktif' },
                    fromRow: (m) => ({
                        name: m.name,
                        member_number: m.member_number,
                        study_program: m.study_program ?? '',
                        type: m.type,
                        email: m.email ?? '',
                        status: m.status,
                    }),
                    fields: [
                        { name: 'name', label: 'Nama lengkap', span: 2, required: true },
                        { name: 'member_number', label: 'NIM / NIP', required: true },
                        { name: 'study_program', label: 'Program studi', type: 'select', options: options.studyPrograms, required: true },
                        { name: 'type', label: 'Jenis', type: 'select', options: options.types, required: true },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'status', label: 'Status', type: 'select', options: options.statuses, required: true },
                    ],
                }}
            />
        </StafLayout>
    );
}
