import React, { createContext, useState } from 'react';
const cities = require('../assets/data/cityList.json');

// 创建一个Context对象
export const GlobalContext = createContext({
  selectedCityId: '1',
  selectedCityInfo: null,
  updateSelectedCityId: (cityId) => {},
  updateSelectedCityInfo: (cityInfo) => {},
});

const getCityInfoById = (cityId) => {
  // 在城市列表中查找匹配的城市
  const city = cities.find(city => city.cityID === Number(cityId));
  if (city === undefined) {
    return null;
  }
  console.info("global.cityName:"+city.cityName)  
  return city ? city : null;
};

// 创建一个Provider组件，它接收值作为props，并把这些值提供给其所有子组件
export const GlobalProvider = ({ children }) => {
  const [selectedCityId, setSelectedCityId] = useState('1');
  const initCityInfo = getCityInfoById(selectedCityId);
  const [selectedCityInfo,setSelectedCityInfo] = useState(initCityInfo);
  const updateSelectedCityId = (selectedCityId) => {
    setSelectedCityId(selectedCityId);
  };

  const updateSelectedCityInfo = (selectedCityInfo) => {
    setSelectedCityId(selectedCityInfo.cityID);
    setSelectedCityInfo(selectedCityInfo)
  };
  
  return (
    <GlobalContext.Provider value={{ selectedCityId, selectedCityInfo, updateSelectedCityId, updateSelectedCityInfo }}>
      {children}
    </GlobalContext.Provider>
  );
};

// 导出Context对象，以便在子组件中使用
export const useGlobal = () => React.useContext(GlobalContext);