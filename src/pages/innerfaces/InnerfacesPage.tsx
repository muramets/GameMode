import { useScoreContext } from '../../contexts/ScoreProvider';
import { InnerfacesGrid } from './components/InnerfacesGrid';

export function InnerfacesPage() {
    const { innerfaces } = useScoreContext();

    return (
        <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-text-primary">Innerfaces</h1>
                <p className="text-sub text-sm">Fundamental metrics and base traits that define your current state.</p>
            </div>

            <InnerfacesGrid innerfaces={innerfaces} />
        </div>
    );
}

export default InnerfacesPage;
