type DevicePlaceholderProps = {
  category: "Phone" | "Tablet";
  className?: string;
};

export function DevicePlaceholder({ category, className = "" }: DevicePlaceholderProps) {
  const isTablet = category === "Tablet";

  return (
    <div
      aria-hidden="true"
      className={`device-placeholder ${isTablet ? "device-placeholder--tablet" : "device-placeholder--phone"} ${className}`.trim()}
    >
      <div className="device-placeholder__screen">
        <span className="device-placeholder__glow" />
        <span className="device-placeholder__camera" />
      </div>
    </div>
  );
}
