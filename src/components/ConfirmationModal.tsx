import React from "react";

// shadcn UI components
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
	title: string;
	children: React.ReactNode;
	open: boolean;
	onClose: (value: boolean) => void;
	onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	title,
	children,
	open,
	onClose,
	onConfirm
}) => {
	return (
		<Dialog open={open} onOpenChange={(value) => onClose(!value)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<DialogDescription className="py-4 border-y">
					{children}
				</DialogDescription>
				<DialogFooter className="sm:justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => onClose(false)}
					>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							onClose(false);
							onConfirm();
						}}
					>
						Confirmar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConfirmationModal;