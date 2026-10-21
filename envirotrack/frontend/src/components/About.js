// About.js

import React from 'react';
import { FiActivity, FiDownload, FiFilter, FiThermometer } from 'react-icons/fi';
import SubHeader from './SubHeader';
import './About.css';

const APP_VERSION = '2.0.0';

const FEATURES = [
  { icon: FiThermometer, title: 'Журнал параметров', text: 'Регистрация температуры, влажности, давления и дополнительных параметров по помещениям и зданиям с контролем граничных значений.' },
  { icon: FiActivity, title: 'Средства измерений', text: 'Учёт СИ, сроков поверки и пригодности; негодные СИ подсвечиваются при заполнении записи.' },
  { icon: FiFilter, title: 'Личные фильтры', text: 'Фильтр списка закрепляется за пользователем и восстанавливается на любом компьютере.' },
  { icon: FiDownload, title: 'Выгрузка в Excel', text: 'Отчёт по выбранному периоду, помещениям, зданиям и ответственным.' },
];

const About = () => (
  <>
    <SubHeader />
    <main className='page'>
      <section className='about card'>
        <header className='about__head'>
          <h1>Журнал регистрации параметров окружающей среды</h1>
          <span className='badge badge--brand'>Версия {APP_VERSION}</span>
        </header>
        <p className='about__lead'>
          Программа предназначена для регистрации и контроля параметров окружающей среды. Она предоставляет удобный
          интерфейс для управления средствами измерений, анализа данных и формирования отчётов.
        </p>
        <div className='about__features'>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className='about__feature'>
              <Icon />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  </>
);

export default About;
