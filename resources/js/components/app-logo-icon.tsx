import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/images/logo-stpn.png" alt="Logo Politeknik Agraria STPN" {...props} className={`object-contain ${props.className ?? ''}`} />;
}
