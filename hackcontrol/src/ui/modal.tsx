import type { ReactNode } from "react";
import { Cancel } from "@/ui/icons";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./button";

interface ModalProps {
  btn: ReactNode;
  action?: () => void;
  actionText?: string;
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  wide?: boolean;
}

const Modal = (props: ModalProps) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{props.btn}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0a0a0c]/75 data-[state=open]:animate-overlayShow backdrop-blur-sm" />
        <Dialog.Content className={`fixed top-[50%] left-[50%] z-50 max-h-[85vh] w-[90vw] ${props.wide ? 'max-w-[600px]' : 'max-w-[450px]'} translate-x-[-50%] translate-y-[-50%] overflow-auto rounded-[6px] border border-white/10 bg-[#181820] p-[25px] font-sans opacity-100 shadow-[0_8px_32px_rgba(0,0,0,0.55)] focus:outline-none data-[state=open]:animate-contentShow`}>
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="font-display text-xl font-semibold">
              {props.title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Cancel
                width={25}
                className="duration-120 cursor-pointer text-gray-400 transition-all hover:scale-105"
              />
            </Dialog.Close>
          </div>
          {props.children}
          {props.action && (
            <div className="mt-6 flex items-center justify-end space-x-2">
              <Dialog.Close asChild>
                <Button onClick={props.action} icon={props.icon}>
                  {props.actionText}
                </Button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
