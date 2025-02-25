import { FC } from "react";

interface SettingSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: (string | number)[];
  formatOption?: (value: string | number) => string;
}

const SettingSelect: FC<SettingSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  formatOption,
}) => {
  return (
    <div className="space-y-2 text-zinc-800">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SettingSelect;
