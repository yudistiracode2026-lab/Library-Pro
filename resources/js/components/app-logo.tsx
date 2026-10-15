import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-9 flex-none" />
            <div className="ml-1 grid flex-1 text-left leading-tight">
                <span className="font-display truncate text-sm font-extrabold tracking-wide">PUSTAGRA</span>
                <span className="text-fg-3 truncate text-xs">Perpustakaan STPN</span>
            </div>
        </>
    );
}
