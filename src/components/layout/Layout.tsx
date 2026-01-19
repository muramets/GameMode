import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { ViewerBanner } from './ViewerBanner';

export function Layout({ children }: { children: React.ReactNode }) {
    // Structure mimics MonkeyType #app.content-grid
    // Using the ported #app and .content-grid rules from index.css
    // REMOVED explicit pt-8 pb-8 because #app in index.css already sets padding-top/bottom: 2rem
    return (
        <>
            <ViewerBanner />
            <div id="app" className="content-grid transition-colors duration-300 font-mono">
                <Header />
                <main className="w-full h-full flex flex-col gap-4">
                    {useLocation().pathname !== '/settings' && <Navigation />}
                    {children}
                </main>
            </div>
        </>
    );
}
