import AppLogoIcon from '@/components/app-logo-icon';
import { StafIcon } from '@/components/staf/staf-icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type SharedData, type StafMenuItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Globe } from 'lucide-react';

const DASHBOARD = '/staf';

function isActive(currentPath: string, href: string | null): boolean {
    if (!href) return false;
    if (href === DASHBOARD) return currentPath === DASHBOARD;

    return currentPath === href || currentPath.startsWith(`${href}/`);
}

const itemClass = 'h-[38px] rounded-[10px] px-2.5 text-sm font-medium text-fg-2 data-[active=true]:font-semibold [&>svg]:size-[17px]';

export function StafSidebar() {
    const { stafMenu } = usePage<SharedData>().props;
    const currentPath = usePage().url.split('?')[0];

    return (
        <Sidebar collapsible="offcanvas">
            <SidebarHeader className="px-3 pt-4 pb-2">
                <Link href={DASHBOARD} prefetch className="flex items-center gap-2.5 px-2 pb-2">
                    <AppLogoIcon className="size-[42px] flex-none rounded-full bg-white" />
                    <span className="flex flex-col leading-tight">
                        <span className="font-display text-sm font-extrabold tracking-[.04em]">PUSTAGRA</span>
                        <span className="text-fg-3 text-[11px]">Portal staf perpustakaan</span>
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="gap-0 px-1.5">
                {stafMenu?.map((group) => (
                    <SidebarGroup key={group.label} className="py-1">
                        <SidebarGroupLabel className="text-fg-4 h-7 px-2.5 text-[11px] font-semibold tracking-[.08em] uppercase">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarMenu className="gap-0.5">
                            {group.items.map((item) =>
                                item.children ? (
                                    <StafMenuParent key={item.key} item={item} currentPath={currentPath} />
                                ) : (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild isActive={isActive(currentPath, item.href)} className={itemClass}>
                                            <Link href={item.href!} prefetch>
                                                <StafIcon name={item.icon} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {item.badge ? (
                                            <SidebarMenuBadge className="bg-sunset top-2.5 right-2 h-5 min-w-5 rounded-full px-1.5 text-[11px] font-bold text-white peer-hover/menu-button:text-white peer-data-[active=true]/menu-button:text-white">
                                                {item.badge}
                                            </SidebarMenuBadge>
                                        ) : null}
                                    </SidebarMenuItem>
                                ),
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-sidebar-border border-t px-3 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className={itemClass}>
                            <a href="/">
                                <Globe />
                                <span>Lihat website</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

function StafMenuParent({ item, currentPath }: { item: StafMenuItem; currentPath: string }) {
    const childActive = item.children!.some((child) => isActive(currentPath, child.href));

    return (
        <Collapsible asChild defaultOpen={childActive} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={itemClass}>
                        <StafIcon name={item.icon} />
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto !size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 border-l-0 px-0 pl-3">
                        {item.children!.map((child) => (
                            <SidebarMenuSubItem key={child.key}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(currentPath, child.href)}
                                    className="text-fg-2 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground h-[34px] rounded-[10px] px-2.5 text-[13px] data-[active=true]:font-semibold [&>svg]:size-4"
                                >
                                    <Link href={child.href!} prefetch>
                                        <StafIcon name={child.icon} />
                                        <span>{child.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
