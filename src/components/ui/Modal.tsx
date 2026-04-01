import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    type = 'info'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10"
                    >
                        <div className="space-y-6 text-center">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                                    {title}
                                </h3>
                                <p className="text-on-surface-variant leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    variant={type === 'danger' ? 'primary' : 'primary'}
                                    className={type === 'danger' ? 'bg-red-500 hover:bg-red-600 border-none' : ''}
                                >
                                    {confirmText}
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
