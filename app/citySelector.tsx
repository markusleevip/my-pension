import { useState } from 'react';
import { View, Text,Button, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobal } from './globalContext';

const storeData = async (key,value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // saving error
  }
};


const cities = require('../assets/data/cityList.json');

const getCityInfoById = (cityId) => {  
  // 在城市列表中查找匹配城市
  const city = cities.find(city => city.cityID === Number(cityId));
  if (city === undefined) {
    console.info("getCityInfoById result is null.")
    return null;
  }
  return city ? city : null;
};
const CitySelector = () => {
  const { selectedCityId, selectedCityInfo, updateSelectedCityId, updateSelectedCityInfo } = useGlobal();

  // 使用状态存储被选中的城市ID
  const [selectedCityID, setSelectedCityID] = useState(null);

  // 点击城市时的处理函数
  const handleSelectCity = (cityID) => {
    setSelectedCityID(cityID); // 更新选中的城市ID状态
    storeData('cityId',''+cityID);
    updateSelectedCityId(cityID)
    updateSelectedCityInfo(getCityInfoById(cityID))
  };

  const renderCityItem = ({ item }) =>  (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleSelectCity(item.cityID)}
    >
      <Text style={[styles.title, item.cityID === selectedCityID && styles.selected]}>
        {item.cityName}
      </Text>
      {item.cityID === selectedCityID && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>selectedCityId: {selectedCityId}</Text>
      </View>
      <FlatList
        data={cities}
        renderItem={renderCityItem}
        keyExtractor={item => item.cityID.toString()}
        extraData={selectedCityID}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92abca',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
  },
  selected: {
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 24,
    marginLeft: 10,
    color: 'green',
  },
});

export default CitySelector;