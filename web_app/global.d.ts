export type UnisatWalletInterface = {
    getAccounts(): Promise<string[]>;
    requestAccounts(): Promise<string[]>;
    getNetwork(): Promise<string>;
    switchNetwork(network: string): Promise<void>;
    sendBitcoin(address: string, amount: number, options: { fee?: number; memo?: string }): Promise<string>;
    on(event: string, listener: (event: Event) => void): void;
    removeListener(event: string, listener: (event: Event) => void): void;
    signMessage(message: string, type?: string): Promise<string>;
    signPsbt(psbt: string, opt: { autoFinalized: boolean }): Promise<string>;
    getPublicKey(): Promise<string>;
    getBalance(): Promise<{
        confirmed: number,
        unconfirmed: number,
        total: number
    }>;
    inscribeTransfer(tick: string, amount?: number | string): Promise<{
        amount: string,
        inscriptionId: string
        inscriptionNumber: number
        ticker: string
    }>;
    getInscriptions(num: number): Promise<void>;
    switchChain(network: string): Promise<void>;
}

declare global {
    interface Window {
        unisat: UnisatWalletInterface;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ethereum?: any;
        ic: {
            plug: {
                requestConnect: (options: { whitelist: string[] }) => Promise<void>;
                agent: {
                    getPrincipal: () => Promise<string>;
                };
                requestBalance?: () => Promise<{ amount: number; currency: string }>;
                requestTransfer?: (args: { to: string; amount: number }) => Promise<{ success: boolean; transactionId: string }>;
                createActor: (args: { canisterId: string; interfaceFactory: InterfaceFactory }) => Promise<Actor>;
            };
        };
    }
}
