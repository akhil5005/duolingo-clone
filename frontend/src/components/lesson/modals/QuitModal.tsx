"use client";

import { Mascot } from "@/components/mascot/Mascot";
import { Button3D } from "@/components/ui/Button3D";
import { Modal } from "@/components/ui/Modal";

interface QuitModalProps {
  open: boolean;
  onStay: () => void;
  onQuit: () => void;
}

export function QuitModal({ open, onStay, onQuit }: QuitModalProps) {
  return (
    <Modal open={open} onClose={onStay} label="Quit this lesson?">
      <div className="flex flex-col items-center gap-4 text-center">
        <Mascot expression="sad" size={116} />
        <h2 className="text-xl">Wait, don&apos;t go!</h2>
        <p className="text-sm font-semibold text-muted">
          You&apos;ll lose your progress if you quit now.
        </p>
        <Button3D variant="primary" size="lg" fullWidth onClick={onStay}>
          Keep learning
        </Button3D>
        <Button3D variant="ghost" size="lg" fullWidth onClick={onQuit} className="!text-danger">
          End session
        </Button3D>
      </div>
    </Modal>
  );
}
