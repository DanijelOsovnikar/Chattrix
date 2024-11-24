import jwt from "jsonwebtoken";

const genTokenAndSetCookies = (userId, res) => {
  const id = userId.toString();

  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, //MS
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export default genTokenAndSetCookies;
