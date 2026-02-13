import { AlertTriangle } from 'lucide-react';

export const RiskDisclaimer = () => {
    return (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-8">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-600 m-0 mb-1">Institutional Risk Warning</p>
                    <p className="text-sm text-muted-foreground m-0">
                        The strategies described in this protocol involve significant financial risk and may not be suitable for all investors.
                        <strong>Leveraged structures (Subject-To, Seller Finance) carry acceleration risks.</strong>
                        QuickLiqi recommends consulting with qualified legal counsel before executing any contracts referenced herein.
                    </p>
                </div>
            </div>
        </div>
    );
};
