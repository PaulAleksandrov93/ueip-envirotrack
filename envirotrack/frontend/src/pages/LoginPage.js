// LoginPage.js

import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import './LoginPage.css';
import { FaUser, FaLock } from 'react-icons/fa';

const LoginPage = () => {
  let { loginUser } = useContext(AuthContext);
  

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={loginUser}>
        <label htmlFor="username">
           <FaUser /> Имя пользователя:
        </label>
        <input type="text" id="username" name="username" placeholder="Введите имя пользователя" />
        <label htmlFor="password">
           <FaLock /> Пароль:
        </label>
        <input type="password" id="password" name="password" placeholder="Введите пароль" />

        <button type="submit" className="login-button">
          Войти
        </button>
      </form>
    </div>
  );
};

export default LoginPage;


// LoginPage.js

// import React, { useContext, useState } from 'react';
// import AuthContext from '../context/AuthContext';
// import './LoginPage.css';
// import { FaUser, FaLock } from 'react-icons/fa';

// const LoginPage = () => {
//   const [error, setError] = useState('');
//   const { loginUser } = useContext(AuthContext);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     const username = e.target.elements.username.value;
//     const password = e.target.elements.password.value;
    
//     try {
//       await loginUser(username, password);
//     } catch (error) {
//       setError('Неверное имя пользователя или пароль');
//     }
//   };

//   return (
//     <div className="login-page">
//       <form className="login-form" onSubmit={loginUser}>
//         <label htmlFor="username">
//           <FaUser /> Имя пользователя:
//         </label>
//         <input type="text" id="username" name="username" placeholder="Введите имя пользователя" />
//         <label htmlFor="password">
//           <FaLock /> Пароль:
//         </label>
//         <input type="password" id="password" name="password" placeholder="Введите пароль" />
//         <button type="submit" className="login-button">
//           Войти
//         </button>
//         {error && <p className="error-message">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default LoginPage;


