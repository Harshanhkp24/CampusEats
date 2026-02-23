import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(
    JSON.parse(sessionStorage.getItem("cartItems")) || []
  );

  const [cartShop, setCartShop] = useState(
    sessionStorage.getItem("cartShop") || null
  );


  // ADD ITEM
  const addToCart = (item, shopId) => {

    // If cart belongs to another shop → reset cart
    if (cartShop && cartShop !== shopId) {
      setCartShop(shopId);
      setCartItems([{ ...item, qty: 1 }]);
      return;
    }

    setCartShop(shopId);

    setCartItems((prev) => {
      const exist = prev.find((i) => i._id === item._id);

      if (exist) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });
  };

  // REMOVE ITEM
  const removeFromCart = (id) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartShop(null);
    sessionStorage.removeItem("cartItems");
    sessionStorage.removeItem("cartShop");
  };

  useEffect(() => {
    sessionStorage.setItem("cartItems", JSON.stringify(cartItems));

    if (cartShop) {
      sessionStorage.setItem("cartShop", cartShop);
    } else {
      sessionStorage.removeItem("cartShop");
    }
  }, [cartItems, cartShop]);



  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, cartShop }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
