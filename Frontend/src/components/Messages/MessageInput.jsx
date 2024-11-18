import React, { useState } from "react";
import { BsSend } from "react-icons/bs";
import useSendMessage from "../../context/hooks/useSendMessage";

const MessageInput = () => {
  const { loading, sendMessage } = useSendMessage();
  const [activeForm, setActiveForm] = useState(false);
  const [ean, setEan] = useState("");
  const [naziv, setNaziv] = useState("");
  const [kupac, setKupac] = useState("");
  const [ime, setIme] = useState("");
  const [sava, setSava] = useState(false);
  const [pack, setPack] = useState(false);
  const [rez, setRez] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let message = {
      ean,
      sava,
      toPack: pack,
      sellerId: ime,
      productName: naziv,
      rez,
      buyer: kupac,
    };
    await sendMessage(message);

    setActiveForm(false);
    setEan("");
    setNaziv("");
    setKupac("");
    setSava(false);
    setPack(false);
    setRez(false);
  };

  return (
    <>
      {activeForm ? (
        <form className="px-4 my-3" onSubmit={handleSubmit}>
          <div className="w-full relative">
            <input
              type="text"
              placeholder="EAN"
              id="ean"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
            />
            <input
              type="text"
              placeholder="NAZIV PROIZVODA"
              id="naziv"
              value={naziv}
              onChange={(e) => setNaziv(e.target.value)}
              className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
            />
            <input
              type="text"
              placeholder="IME KUPCA"
              id="kupac"
              value={kupac}
              onChange={(e) => setKupac(e.target.value)}
              className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
            />
            <select
              name="ime"
              id="ime"
              onChange={(e) => setIme(e.target.value)}
              className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
            >
              <option value="" selected>
                Izaberi prodavca
              </option>
              <option value="Mita Babic">Mita Babic</option>
              <option value="Tijana Vlatkovic">Tijana Vlatkovic</option>
              <option value="Bogdan Ostojic">Bogdan Ostojic</option>
              <option value="Danijel Osovnikar">Danijel Osovnikar</option>
              <option value="Jovan Milosavljevic">Jovan Milosavljevic</option>
            </select>
            <p className="my-2">Sava Osiguranje</p>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="savaDa"
            >
              Da
              <input
                type="radio"
                name="sava"
                id="savaDa"
                className="appearance-none"
                onChange={() => setSava(true)}
              />
            </label>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="savaNe"
            >
              Ne
              <input
                type="radio"
                name="sava"
                id="savaNe"
                className="appearance-none"
                onChange={() => setSava(false)}
              />
            </label>
            <p className="my-2">Pakovanje proizvoda</p>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="packDa"
            >
              Da
              <input
                type="radio"
                name="pack"
                id="packDa"
                className="appearance-none"
                onChange={() => setPack(true)}
              />
            </label>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="packNe"
            >
              Ne
              <input
                type="radio"
                name="pack"
                id="packNe"
                className="appearance-none"
                onChange={() => setPack(false)}
              />
            </label>
            <p className="my-2">Vec odvojen na rezervaciji</p>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="rezDa"
            >
              Da
              <input
                type="radio"
                name="rez"
                id="rezDa"
                className="appearance-none"
                onChange={() => setRez(true)}
              />
            </label>
            <label
              className="m-2 checkbox-label p-2 cursor-pointer rounded-md"
              htmlFor="rezNe"
            >
              Ne
              <input
                type="radio"
                name="rez"
                id="rezNe"
                className="appearance-none"
                onChange={() => setRez(false)}
              />
            </label>
            <button
              type="submit"
              className="absolute end-0 flex items-center pe-3"
            >
              <BsSend className="w-6 h-6" />
            </button>
          </div>
        </form>
      ) : (
        <button
          className="p-2 m-4 my-3 w-11/12 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
          onClick={() => setActiveForm(true)}
        >
          Send a order
        </button>
      )}
    </>
  );
};

export default MessageInput;
