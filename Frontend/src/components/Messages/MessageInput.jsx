import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { BsSend } from "react-icons/bs";
import useSendMessage from "../../context/hooks/useSendMessage";
import { useAuthContext } from "../../context/AuthContext";
import MainInputFields from "./MainInputFields";
import useConversations from "../../store/useConversation";
import { BsQrCodeScan, BsBuilding } from "react-icons/bs";

const MessageInput = () => {
  const ref = useRef();
  const { authUser } = useAuthContext();
  const {
    setScannerResult,
    setScannerResultName,
    setQrCodeKupac,
    scannerResultKupac,
    selectedConversation,
    isExternalWarehouse,
  } = useConversations();

  const { loading, sendMessage } = useSendMessage();
  const [activeForm, setActiveForm] = useState(false);
  const [kupacFilledByQR, setKupacFilledByQR] = useState(false);

  // React Hook Form setup
  const methods = useForm({
    defaultValues: {
      messages: [
        { ean: "", naziv: "", qty: 1, pack: "false", web: "", rez: "false" },
      ],
      kupac: "",
      kupacName: "",
      ime: "",
      savaGodine: "",
      sava: "false",
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "messages",
  });

  // Watch specific fields for conditional rendering
  const watchSava = watch("sava");
  const watchKupac = watch("kupac");

  // Reset QR flag when kupac field is manually edited
  useEffect(() => {
    // Only reset if the field was previously filled by QR and now it's different
    if (kupacFilledByQR && watchKupac !== scannerResultKupac) {
      setKupacFilledByQR(false);
    }
  }, [watchKupac, kupacFilledByQR, scannerResultKupac]);

  // Set seller name when form becomes active
  useEffect(() => {
    if (activeForm && authUser?.fullName) {
      setValue("ime", authUser.fullName);
    }
  }, [activeForm, authUser?.fullName, setValue]);

  // Handle scanner result for kupac field
  useEffect(() => {
    if (scannerResultKupac) {
      setValue("kupac", scannerResultKupac);
      setKupacFilledByQR(true); // Mark that this field was filled by QR
    }
  }, [scannerResultKupac, setValue]);

  const addMessage = () => {
    setScannerResult("");
    setScannerResultName("");
    append({
      ean: "",
      naziv: "",
      qty: 1,
      pack: "false",
      web: "",
      rez: "false",
    });
  };

  const onSubmit = async (data) => {
    const baseMessage = {
      messages: data.messages.map((item) => ({
        ean: item.ean,
        naziv: item.naziv,
        qty: item.qty,
        pack: item.pack === "true",
        web: item.web,
        rez: item.rez === "true",
      })),
      sava: data.sava === "true",
      sellerId: data.ime,
      senderUsername: authUser.userName, // Include sender's username
      buyer: data.kupac,
      buyerName: data.kupacName, // Include customer name if available
      opened: false,
      savaGodine: data.savaGodine,
    };

    // Add external request fields if this is an external conversation
    const message = isExternalWarehouse
      ? {
          ...baseMessage,
          isExternalRequest: true,
          targetWarehouseId: selectedConversation?.warehouseId,
          orderNumber: `EXT-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`, // Auto-generate order number
          orderDate: new Date().toISOString(),
          externalStatus: "pending",
        }
      : baseMessage;

    await sendMessage(message);

    // Reset form and close
    setActiveForm(false);
    setKupacFilledByQR(false); // Reset QR flag

    reset({
      messages: [
        { ean: "", naziv: "", qty: 1, pack: "false", web: "", rez: "false" },
      ],
      kupac: "",
      kupacName: "",
      ime: "",
      savaGodine: "",
      sava: "false",
    });
  };

  const handleNameCodeClick = () => {
    setQrCodeKupac(true);
  };

  // Don't show message input for tracking view
  if (selectedConversation?._id === "tracking_outgoing_requests") {
    return null;
  }

  return (
    <>
      {activeForm ? (
        <FormProvider {...methods}>
          <form
            className="py-3 overflow-y-scroll"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex justify-between items-center mb-4">
              {/* Show selected external warehouse info */}
              {isExternalWarehouse && selectedConversation?.isExternal && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-lg">
                  <BsBuilding className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    External: {selectedConversation.fullName} (
                    {selectedConversation.code})
                  </span>
                </div>
              )}

              {/* For internal requests, just show empty div to maintain layout */}
              {!isExternalWarehouse && <div></div>}

              <button
                type="button"
                onClick={addMessage}
                className="bg-primary text-primary-content py-1 px-4 rounded"
              >
                Add item
              </button>
            </div>

            <div className="w-full relative">
              {fields.map((field, index) => (
                <MainInputFields
                  key={field.id}
                  index={index}
                  onRemove={() => remove(index)}
                  canDelete={fields.length > 1}
                  isExternalRequest={isExternalWarehouse}
                />
              ))}
              <div className="groupInputQr">
                <input
                  type="text"
                  placeholder="Ime kupca"
                  id="kupac"
                  {...control.register("kupac")}
                  className="border my-2 text-sm pr-12 truncate rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
                />
                <button
                  type="button"
                  className="qrCodeBtn"
                  onClick={handleNameCodeClick}
                >
                  <BsQrCodeScan />
                </button>
              </div>

              {/* Conditional customer name field - only show when kupac was filled by QR */}
              {kupacFilledByQR && (
                <input
                  type="text"
                  placeholder="Ime kupca"
                  id="kupacName"
                  {...control.register("kupacName")}
                  className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
                />
              )}

              <input
                ref={ref}
                type="text"
                placeholder="Prodavac"
                id="ime"
                {...control.register("ime")}
                className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
              />
              {/* Sava Osiguranje - only show for internal requests */}
              {!isExternalWarehouse && (
                <fieldset className="fieldset bg-base-100 border-primary rounded-box border p-4 my-4">
                  <legend className="fieldset-legend px-2">
                    Sava Osiguranje
                  </legend>
                  <label className="label cursor-pointer">
                    <span className="label-text">Da</span>
                    <input
                      type="radio"
                      value="true"
                      id="savaDa"
                      {...control.register("sava")}
                      className="radio radio-primary"
                    />
                  </label>
                  <label className="label cursor-pointer">
                    <span className="label-text">Ne</span>
                    <input
                      type="radio"
                      value="false"
                      id="savaNe"
                      {...control.register("sava")}
                      className="radio radio-primary"
                    />
                  </label>
                  {watchSava === "true" && (
                    <div className="mt-4 pl-4 border-l-2 border-primary/30">
                      <label className="label cursor-pointer">
                        <span className="label-text">1 Godina</span>
                        <input
                          type="radio"
                          value="1 Godina"
                          id="savaGodina"
                          {...control.register("savaGodine")}
                          className="radio radio-primary"
                        />
                      </label>
                      <label className="label cursor-pointer">
                        <span className="label-text">2 Godine</span>
                        <input
                          type="radio"
                          value="2 Godine"
                          id="savaDveGodine"
                          {...control.register("savaGodine")}
                          className="radio radio-primary"
                        />
                      </label>
                    </div>
                  )}
                </fieldset>
              )}
              <button
                type="submit"
                className="flex justify-center items-center my-4 bg-primary text-primary-content py-2 px-8 rounded mt-[27px]"
                disabled={loading}
              >
                {authUser.role === "warehouseman" &&
                selectedConversation?.isExternalShop
                  ? "Send message"
                  : "Send request"}
                <BsSend className="w-5 h-5 ml-2" />
              </button>
            </div>
          </form>
        </FormProvider>
      ) : (
        // Show "Send a order" button for non-warehousemen OR warehousemen viewing external shop conversations
        (authUser.role !== "warehouseman" ||
          (authUser.role === "warehouseman" &&
            selectedConversation?.isExternalShop)) && (
          <button
            className="p-2 w-full bg-primary mt-4 rounded-lg text-primary-content"
            onClick={() => {
              setActiveForm(true);
              setTimeout(() => {
                if (authUser?.fullName) {
                  setValue("ime", authUser.fullName);
                }
              }, 100);
            }}
          >
            {authUser.role === "warehouseman" &&
            selectedConversation?.isExternalShop
              ? "Send message"
              : "Send a order"}
          </button>
        )
      )}
    </>
  );
};

export default MessageInput;
