import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default function InformationCard({ message }: { message: string }) {
    return (
        <div className='animate-fade-in-up flex items-center justify-center w-full min-h-[60vh]'>
            <Card className='border-2 w-full max-w-[90vw] md:max-w-96'>
                <CardHeader className='py-16'>
                    <CardTitle className='text-center tracking-wide text-2xl'>{message}</CardTitle>
                </CardHeader>
            </Card>
        </div>
    )
}
