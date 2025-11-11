import { useEffect, useState } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";

export interface Toast {
    id: string;
    message: string;
    type: "success" | "error";
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
            } animate-slide-in`}
        >
            {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p
                className={`text-sm font-medium ${
                    toast.type === "success" ? "text-green-800" : "text-red-800"
                }`}
            >
                {toast.message}
            </p>
            <button
                onClick={() => onClose(toast.id)}
                className={`ml-auto ${
                    toast.type === "success"
                        ? "text-green-600 hover:text-green-700"
                        : "text-red-600 hover:text-red-700"
                }`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const closeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return { toasts, showToast, closeToast };
}
