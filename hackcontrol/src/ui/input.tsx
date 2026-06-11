export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  disabled?: boolean;
}

// For react-hook-forms inputs :'
export const inputStyles =
  "mt-2 mb-2 block w-full rounded-md border border-white/10 bg-[#181820] py-2 px-3 text-white placeholder-[#555568] outline-none transition focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/20";

const Input = (props: InputProps) => {
  return <input className={inputStyles} {...props} />;
};

export default Input;
