import React from 'react';
import ListItem from '../components/ListItem';
import RecordsPage from '../components/RecordsPage';

const today = () => new Date().toLocaleDateString('ru-RU');

const ParametersListPage = () => (
  <RecordsPage
    scope='rooms'
    title='Параметры по помещениям'
    endpoint='/api/filterParameters/'
    exportUrl='/api/export-parameters/'
    exportName={() => `Параметры по помещениям от ${today()}.xlsx`}
    newPath='/room-parameter/new'
    ItemComponent={ListItem}
  />
);

export default ParametersListPage;
