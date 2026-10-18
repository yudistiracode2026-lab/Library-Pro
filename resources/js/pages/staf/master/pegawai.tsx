import { Cell, StatusBadge } from '@/components/staf/master/cells';
import { MasterPage } from '@/components/staf/master/master-page';
import { type FieldDef } from '@/components/staf/master/record-form';
import StafLayout from '@/layouts/staf-layout';
import { type Paginated, type SelectOption } from '@/types';

interface EmployeeRow {
    id: number;
    nip: string;
    name: string;
    golongan: string;
    pangkat: string | null;
    position: string;
    status: string;
    is_head: boolean;
    has_account: boolean;
}

interface PegawaiProps {
    kind: 'pustakawan' | 'tendik';
    records: Paginated<EmployeeRow>;
    filters: { q: string; urut?: string; arah?: string };
    options: { golongan: SelectOption[]; positions: SelectOption[] | null; statuses: SelectOption[] };
}

const COPY = {
    pustakawan: {
        title: 'Master pustakawan',
        heading: 'Data pustakawan',
        description: 'Pustakawan fungsional, termasuk kepala perpustakaan',
        add: 'Tambah pustakawan',
    },
    tendik: {
        title: 'Master tendik',
        heading: 'Data tenaga kependidikan',
        description: 'Staf pendukung layanan perpustakaan',
        add: 'Tambah tendik',
    },
};

export default function Pegawai({ kind, records, filters, options }: PegawaiProps) {
    const copy = COPY[kind];

    const fields: FieldDef[] = [
        { name: 'name', label: 'Nama lengkap', span: 2, required: true, placeholder: 'Lengkap dengan gelar' },
        { name: 'nip', label: 'NIP', required: true, placeholder: '18 digit' },
        { name: 'golongan', label: 'Golongan · pangkat', type: 'select', options: options.golongan, required: true },
        options.positions
            ? { name: 'position', label: 'Jabatan', type: 'select', options: options.positions, required: true }
            : { name: 'position', label: 'Jabatan', required: true },
        { name: 'status', label: 'Status', type: 'select', options: options.statuses, required: true },
        { name: 'is_head', label: 'Kepala perpustakaan', type: 'checkbox', span: 2, hint: 'hanya satu orang' },
    ];

    return (
        <StafLayout title={copy.title} group="Master data">
            <MasterPage<EmployeeRow>
                routeKey={kind}
                heading={copy.heading}
                description={copy.description}
                addLabel={copy.add}
                records={records}
                filters={filters}
                numbered
                grid="minmax(0,1.6fr) 170px 60px minmax(0,1fr) minmax(0,1.3fr) 90px"
                describeRow={(e) => e.name}
                columns={[
                    {
                        label: 'Nama',
                        sort: 'nama',
                        render: (e) => (
                            <Cell bold sub={e.is_head ? 'Kepala Perpustakaan' : undefined}>
                                {e.name}
                            </Cell>
                        ),
                    },
                    { label: 'NIP', sort: 'nip', render: (e) => <Cell mono>{e.nip}</Cell> },
                    { label: 'Gol.', sort: 'golongan', render: (e) => <Cell>{e.golongan}</Cell> },
                    { label: 'Pangkat', sort: 'pangkat', render: (e) => <Cell>{e.pangkat}</Cell> },
                    { label: 'Jabatan', sort: 'jabatan', render: (e) => <Cell>{e.position}</Cell> },
                    { label: 'Status', sort: 'status', render: (e) => <StatusBadge status={e.status} /> },
                ]}
                form={{
                    title: (e) => (e ? `Ubah ${kind}` : copy.add),
                    empty: { name: '', nip: '', golongan: '', position: '', status: 'Aktif', is_head: false },
                    fromRow: (e) => ({ name: e.name, nip: e.nip, golongan: e.golongan, position: e.position, status: e.status, is_head: e.is_head }),
                    fields,
                }}
            />
        </StafLayout>
    );
}
