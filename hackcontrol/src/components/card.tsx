import { hackathonCardProps } from "./hackathonCard";
import styles from "./hackathonCard.module.css";

const Card = ({ name, description, url, showCode = false }: hackathonCardProps) => {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const target = e.target as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }
  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${styles.card} group relative h-full w-full
        cursor-pointer rounded-md border border-white/10
        bg-[#181820] before:absolute
        before:left-0 before:top-0
        before:h-full before:w-full
        before:rounded-border-inherit before:opacity-0 before:transition-opacity
        before:duration-500 before:content-['']
        hover:before:opacity-100`}
    >
      <div
        className={`${styles.card_border} absolute
        left-0 top-0
        h-full w-full
        rounded-border-inherit opacity-0 transition-opacity
        duration-500 content-['']
        group-hover:opacity-100`}
      />
      <div
        className="relative z-[2] m-[1px] flex h-[calc(100%-2px)]
        w-[calc(100%-2px)] flex-col rounded-border-inherit bg-[#181820] p-4"
      >
        <h3 className="text-xl font-semibold text-[#f0f0f5]">{name}</h3>
        {description && (
          <p className="mt-1 flex-1 text-[#8888a0]">{description}</p>
        )}
        {showCode && Boolean(url) && (
          <div className="mt-4 flex items-center space-x-2 text-[#8888a0]">
            <p className="font-mono">{url}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
