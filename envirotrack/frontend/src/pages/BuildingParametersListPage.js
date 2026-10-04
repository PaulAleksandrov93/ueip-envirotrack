import React from 'react';
import ListItemBuilding from '../components/ListItemBuilding';
import RecordsPage from '../components/RecordsPage';

const today = () => new Date().toLocaleDateString('ru-RU');

const BuildingParametersListPage = () => (
  <RecordsPage
    scope='buildings'
    title='Параметры по зданиям'
    endpoint='/api/filterBuildingParameters/'
    exportUrl='/api/export-parameters-buildings/'
    exportName={() => `Параметры по зданиям от ${today()}.xlsx`}
    newPath='/building-parameter/new'
    ItemComponent={ListItemBuilding}
  />
);

export default BuildingParametersListPage;
