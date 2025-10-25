import { useEffect } from "react";
import { BsQrCodeScan, BsTrash } from "react-icons/bs";
import { useFormContext } from "react-hook-form";
import PropTypes from "prop-types";
import useConversations from "../../store/useConversation";

const MainInputFields = ({
  index,
  onRemove,
  canDelete,
  isExternalRequest = false,
}) => {
  const { register, setValue, watch } = useFormContext();
  const {
    setQrCode,
    setQrCodeName,
    activeScannerIndex,
    setActiveScannerIndex,
    scannerResult,
    scannerResultName,
  } = useConversations();

  // Watch the current field values
  const currentEan = watch(`messages.${index}.ean`);
  const currentNaziv = watch(`messages.${index}.naziv`);
  const currentRez = watch(`messages.${index}.rez`);

  useEffect(() => {
    if (activeScannerIndex === index) {
      if (scannerResult && scannerResult !== currentEan) {
        setValue(`messages.${index}.ean`, scannerResult);
      }
      if (scannerResultName && scannerResultName !== currentNaziv) {
        setValue(`messages.${index}.naziv`, scannerResultName);
      }
    }
  }, [
    scannerResult,
    scannerResultName,
    activeScannerIndex,
    index,
    currentEan,
    currentNaziv,
    setValue,
  ]);

  const handleQrCodeClick = () => {
    setQrCode(true);
    setActiveScannerIndex(index);
  };

  const handleNameCodeClick = () => {
    setQrCodeName(true);
    setActiveScannerIndex(index);
  };
  return (
    <div className="border border-primary p-4 rounded-lg mb-4">
      <div className="groupInputQr">
        <input
          type="text"
          placeholder="Ean"
          id={`ean-${index}`}
          {...register(`messages.${index}.ean`)}
          className="border my-2  text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
        />
        <button type="button" className="qrCodeBtn" onClick={handleQrCodeClick}>
          <BsQrCodeScan />
        </button>
      </div>
      <div className="groupInputQr">
        <input
          type="text"
          placeholder="Naziv proizvoda"
          id={`naziv-${index}`}
          {...register(`messages.${index}.naziv`)}
          className="border pr-12 truncate my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
        />
        <button
          type="button"
          className="qrCodeBtn"
          onClick={handleNameCodeClick}
        >
          <BsQrCodeScan />
        </button>
      </div>
      <select
        name={`qty-${index}`}
        id={`qty-${index}`}
        {...register(`messages.${index}.qty`, { valueAsNumber: true })}
        className="border h-[42px] my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>

      {/* Pack radio buttons - only show for internal requests */}
      {!isExternalRequest && (
        <fieldset className="my-2">
          <div className="flex justify-between items-center">
            <legend className="text-sm font-medium text-base-content">
              Treba da se spakuje proizvod
            </legend>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register(`messages.${index}.pack`)}
                  value="true"
                  className="radio radio-primary mr-2"
                />
                <span className="text-sm">Da</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register(`messages.${index}.pack`)}
                  value="false"
                  className="radio radio-primary mr-2"
                />
                <span className="text-sm">Ne</span>
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {/* Rez radio buttons - only show for internal requests */}
      {!isExternalRequest && (
        <fieldset className="my-2">
          <div className="flex justify-between items-center">
            <legend className="text-sm font-medium text-base-content">
              Vec odvojen na rezervaciji
            </legend>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register(`messages.${index}.rez`)}
                  value="true"
                  className="radio radio-primary mr-2"
                />
                <span className="text-sm">Da</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register(`messages.${index}.rez`)}
                  value="false"
                  className="radio radio-primary mr-2"
                />
                <span className="text-sm">Ne</span>
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {/* Conditional Web field - only show when rez is "true" and not external request */}
      {!isExternalRequest && currentRez === "true" && (
        <div className="my-2">
          <input
            type="text"
            placeholder="WEB ili IME"
            id={`web-${index}`}
            {...register(`messages.${index}.web`)}
            className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
          />
        </div>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={onRemove}
          className="flex justify-center items-center bg-error text-error-content hover:bg-error/80 p-1 rounded transition-colors justify-self-end"
          title="Delete item"
        >
          Delete item
          <BsTrash className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );
};

MainInputFields.propTypes = {
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
  canDelete: PropTypes.bool.isRequired,
  isExternalRequest: PropTypes.bool,
};

export default MainInputFields;
