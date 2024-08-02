import jwt from "jsonwebtoken";

export const isAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "No estas autorizado",
    });
  }

  jwt.verify(token, "react2021", (err, decoded) => {
    if (err)
      return res.tatus(401).json({
        message: "No estas autorizado",
      });
    req.userId = decoded.id;
  });

  next();
};
