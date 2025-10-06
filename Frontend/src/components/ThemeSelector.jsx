import { useTheme } from "../context/useTheme";

const ThemeSelector = () => {
  const { theme, themes, changeTheme } = useTheme();

  return (
    <>
      <p className="text-sm mb-2">Select Theme:</p>
      {themes.map((themeName) => (
        <div key={themeName}>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller mb-2 btn btn-sm btn-block btn-ghost justify-start"
            aria-label={themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            value={themeName}
            checked={theme === themeName}
            onChange={() => changeTheme(themeName)}
          />
        </div>
      ))}
    </>
  );
};

export default ThemeSelector;
