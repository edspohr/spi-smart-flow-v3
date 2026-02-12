import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    onCancel: () => void;
}

const SignaturePad = ({ onSave, onCancel }: SignaturePadProps) => {
    const sigPad = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigPad.current?.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigPad.current && !sigPad.current.isEmpty()) {
            onSave(sigPad.current.getTrimmedCanvas().toDataURL('image/png'));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-inner">
                <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        className: 'w-full h-40 bg-white cursor-crosshair'
                    }}
                    onBegin={() => setIsEmpty(false)}
                />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
                <p>Firma dentro del recuadro</p>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button variant="outline" size="sm" onClick={clear} disabled={isEmpty}>
                        <Eraser className="w-3 h-3 mr-1" /> Borrar
                    </Button>
                    <Button size="sm" onClick={save} disabled={isEmpty} className="bg-blue-600 hover:bg-blue-700">
                        <Check className="w-3 h-3 mr-1" /> Confirmar Firma
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
