import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface SelectOption {
    value: string;
    label: string;
}

/** Laravel LengthAwarePaginator serialized to JSON. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface StafMenuItem {
    key: string;
    label: string;
    icon: string;
    href: string | null;
    children: Omit<StafMenuItem, 'children'>[] | null;
}

export interface StafMenuGroup {
    label: string;
    items: StafMenuItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    stafMenu: StafMenuGroup[] | null;
    flash: { success: string | null; error: string | null };
    [key: string]: unknown;
}

export type UserRole = 'admin' | 'pustakawan' | 'pemustaka';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    title: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
