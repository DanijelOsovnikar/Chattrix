import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { BsSend } from "react-icons/bs";
import useSendMessage from "../../context/hooks/useSendMessage";
import { useAuthContext } from "../../context/AuthContext";
import MainInputFields from "./MainInputFields";
import useConversations from "../../store/useConversation";
import { BsQrCodeScan } from "react-icons/bs";

const MessageInput = () => {
  const ref = useRef();
  const { authUser } = useAuthContext();
  const {
    setScannerResult,
    setScannerResultName,
    setQrCodeKupac,
    scannerResultKupac,
  } = useConversations();
  const { loading, sendMessage } = useSendMessage();
  const [activeForm, setActiveForm] = useState(false);

  // React Hook Form setup
  const methods = useForm({
    defaultValues: {
      messages: [{ ean: "", naziv: "", qty: 1 }],
      kupac: "",
      ime: "",
      web: "",
      savaGodine: "",
      sava: "false",
      pack: "false",
      rez: "false",
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "messages",
  });

  // Watch specific fields for conditional rendering
  const watchSava = watch("sava");
  const watchRez = watch("rez");

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
    }
  }, [scannerResultKupac, setValue]);

  const addMessage = () => {
    setScannerResult("");
    setScannerResultName("");
    append({ ean: "", naziv: "", qty: 1 });
  };

  const onSubmit = async (data) => {
    const message = {
      messages: data.messages,
      sava: data.sava === "true",
      toPack: data.pack === "true",
      sellerId: data.ime,
      rez: data.rez === "true",
      buyer: data.kupac,
      opened: false,
      web: data.web,
      savaGodine: data.savaGodine,
    };

    await sendMessage(message);

    // Reset form and close
    setActiveForm(false);
    reset({
      messages: [{ ean: "", naziv: "", qty: 1 }],
      kupac: "",
      ime: "",
      web: "",
      savaGodine: "",
      sava: "false",
      pack: "false",
      rez: "false",
    });
  };

  const handleNameCodeClick = () => {
    setQrCodeKupac(true);
  };

  return (
    <>
      {activeForm ? (
        <FormProvider {...methods}>
          <form
            className="py-3 overflow-y-scroll"
            onSubmit={handleSubmit(onSubmit)}
          >
            <button
              type="button"
              onClick={addMessage}
              className="mb-2 bg-primary text-primary-content py-1 px-4 rounded"
            >
              Add item
            </button>
            <div className="w-full relative">
              {fields.map((field, index) => (
                <MainInputFields
                  key={field.id}
                  index={index}
                  onRemove={() => remove(index)}
                  canDelete={fields.length > 1}
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

              <input
                ref={ref}
                type="text"
                placeholder="Prodavac"
                id="ime"
                {...control.register("ime")}
                className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-base-100 text-base-content !border-primary focus:!ring-0"
              />
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
              <fieldset className="fieldset bg-base-100 border-primary rounded-box border p-4 my-4">
                <legend className="fieldset-legend px-2">
                  Treba da se spakuje proizvod
                </legend>
                <label className="label cursor-pointer">
                  <span className="label-text">Da</span>
                  <input
                    type="radio"
                    value="true"
                    id="packDa"
                    {...control.register("pack")}
                    className="radio radio-primary"
                  />
                </label>
                <label className="label cursor-pointer">
                  <span className="label-text">Ne</span>
                  <input
                    type="radio"
                    value="false"
                    id="packNe"
                    {...control.register("pack")}
                    className="radio radio-primary"
                  />
                </label>
              </fieldset>
              <fieldset className="fieldset bg-base-100 border-primary rounded-box border p-4 my-4">
                <legend className="fieldset-legend px-2">
                  Vec odvojen na rezervaciji
                </legend>
                <label className="label cursor-pointer">
                  <span className="label-text">Da</span>
                  <input
                    type="radio"
                    value="true"
                    id="rezDa"
                    {...control.register("rez")}
                    className="radio radio-primary"
                  />
                </label>
                <label className="label cursor-pointer">
                  <span className="label-text">Ne</span>
                  <input
                    type="radio"
                    value="false"
                    id="rezNe"
                    {...control.register("rez")}
                    className="radio radio-primary"
                  />
                </label>
                {watchRez === "true" && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="WEB ili IME"
                      id="webRez"
                      {...control.register("web")}
                      className="input input-bordered input-primary w-full max-w-xs"
                    />
                  </div>
                )}
              </fieldset>
              <button
                type="submit"
                className={`flex justify-center items-center my-4 bg-primary text-primary-content py-2 px-8 rounded ${
                  watchRez === "true" ? "mt-4" : "mt-[27px]"
                }`}
                disabled={loading}
              >
                Send request
                <BsSend className="w-5 h-5 ml-2" />
              </button>
            </div>
          </form>
        </FormProvider>
      ) : (
        // Hide the "Send a order" button for warehousemen
        authUser.role !== "warehouseman" && (
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
            Send a order
          </button>
        )
      )}
    </>
  );
};

export default MessageInput;
