import  { useState, useEffect} from "react";
import { Link } from 'expo-router';
import { StyleSheet, Button, Text, TextInput, View, Image , Keyboard} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobal } from './globalContext';

const cities = require('../assets/data/cityList.json');
const arrowImg = require('../assets/arrow.png');

const getCityInfoById = (cityId) => {
  // 在城市列表中查找匹配的城市
  const city = cities.find(city => city.cityID === Number(cityId));
  if (city === undefined) {
    return null;
  }
  return city ? city : null;
};

const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (e) {
    // error reading value
  }
};

// 1、基础养老金
function calculateBasicPension(P, i, n) {
  // P: 退休上年度当地在岗职工月平均工资
  // i: 本人历年缴费指数的平均值 北京 最低是 0.7 最高 3
  // n: 本人累计缴费年限（含视同缴费）
  
  // 计算基础养老金
  const basicPension = P * (1 + i) / 2 * n * 0.01;
  return basicPension;
}

function calculateBalance(salaryBase, personalRate,unpaidYears,annualGrowthRate) {
  // 未缴费年数 unpaidYears
  //  每年增长率  annualGrowthRate
  // 当前个人月缴金额
  const monthlyDeposit = salaryBase * personalRate
  let balance = 0;
  for (let year = 0; year < unpaidYears; year++) {
    // 每月存款的年度总和
    let annualDeposit = monthlyDeposit * 12;
    // 加上今年的存款，并考虑上一年的增长
    if (year === 0) {
      balance = annualDeposit;
    } else {
      balance = balance * (1 + annualGrowthRate) + annualDeposit;
    }
  }
  return balance; // 保留两位小数
}

// 2、个人账户养老金
function calculatePersonalPension(salaryBase, personalRate,currentBalance,currentAge, yearsOfPayment, retirementAge,annualGrowthRate) {
  // salaryBase: 缴费工资基数
  // personalRate: 个人缴费费率（如8%）
  // yearsOfPayment: 缴费年数
  // retirementAge: 退休年龄（50、55、60）

  // 根据退休年龄确定计发月数
  const getDivisorByAge = (age) => {
    switch(age) {
      case 50: return 195;
      case 55: return 170;
      case 60: return 139;
      case 65: return 101;
      case 70: return 56;
      default: return 139;
    }
  };

  const personalBalance =  calculateBalance(salaryBase,personalRate,retirementAge - currentAge,annualGrowthRate)

  // 计算个人账户累计存储额
  const totalAmount = personalBalance + currentBalance;

  // 获取计发月数
  const divisor = getDivisorByAge(Number(retirementAge));

  // 个人账户养老金 = 个人账户累计存储额 ÷ 计发月数
  const personalPension = totalAmount / divisor;

  return personalPension;
}
export default function Page() { 

  const readCity = async () => {
    let cityId = await getData('cityId');
    if (cityId===null) {
      cityId = selectedCityId;
    }
    if(cityId !==null){
      const cityInfo = getCityInfoById(cityId);
      if(cityInfo!==null ) {
        setCurrentCityInfo(cityInfo);
        updateSelectedCityId(cityId)
        updateSelectedCityInfo(cityInfo)
      }
    }
  };
  useEffect(() => {
    readCity();
  }, []);
  const {selectedCityId, selectedCityInfo,updateSelectedCityId,updateSelectedCityInfo} = useGlobal();  
  const [currentCityInfo,setCurrentCityInfo] = useState(null); 
  const [currentSaly,setCurrentSaly] = useState(''); 
  const [currentAge, setCurrentAge] = useState('');
  // 当前个人退休金余额
  const [currentBalance,setCurrentBalance] = useState('0');
  // 退休年龄
  const [retirementAge, setRetirementAge] = useState('60');
  // 缴费基数金额
  const [paymentBase, setPaymentBase] = useState('');
  // 已缴费年数
  const [contributedYears, setContributedYears] = useState('0');
  // 
  const [basePension, setBasePension] = useState(null);
  const [personalPension, setPersonalPension] = useState(null);
  const [pension, setPension] = useState(null);
  const [personalBalance,setPersonalBalance] = useState(0);
  const [retireYear,setRetireYear] = useState(0);

  if(selectedCityInfo===null) {
    updateSelectedCityInfo(getCityInfoById(selectedCityId))
  }
  function onChangeCurrentSaly(tempCurrentSaly) {
    let tempPaymentBase = tempCurrentSaly;
    setCurrentSaly(tempCurrentSaly)
    const currentCityInfo = getCityInfoById(selectedCityId)
    if(currentCityInfo!== null){
      const maxSalary = Number(currentCityInfo.maxSalary)
      const minSalary = Number(currentCityInfo.minSalary)
      const tempCurrentSalyNum = Number(tempCurrentSaly)
      if(tempCurrentSalyNum>maxSalary){
        setPaymentBase(currentCityInfo.maxSalary)
        tempPaymentBase = currentCityInfo.maxSalary
      }else if (tempCurrentSalyNum <minSalary){
        setPaymentBase(currentCityInfo.minSalary)
        tempPaymentBase = currentCityInfo.minSalary
      }else {
        setPaymentBase(tempCurrentSaly)
      }
    }
    return tempPaymentBase
  }

  const handleCalculate = () => {
    Keyboard.dismiss()
    updateSelectedCityInfo(getCityInfoById(selectedCityId))
    let tempPaymentBase = currentSaly
    if(currentSaly!==null && !Number.isNaN(Number(currentSaly))){
      tempPaymentBase = onChangeCurrentSaly(currentSaly)
    }else if (currentCityInfo!==null) {
      tempPaymentBase = onChangeCurrentSaly(currentCityInfo.minSalary)
    }else {
      tempPaymentBase = onChangeCurrentSaly("5000")
    }
    
    const annualGrowthRate = 0.03
    const totalYear = Number(retirementAge) - Number(currentAge) + Number(contributedYears)
    const i = Number(tempPaymentBase)/(Number(currentCityInfo.maxSalary)/3)
    const basePension = calculateBasicPension(tempPaymentBase,Number(i.toFixed(1)),totalYear)
    const personalPension = calculatePersonalPension(tempPaymentBase, 0.08,Number(currentBalance), Number(currentAge),totalYear, Number(retirementAge),annualGrowthRate);
    const personalBalance = calculateBalance(tempPaymentBase,0.08,Number(retirementAge) - Number(currentAge) ,annualGrowthRate);
    setPersonalBalance(Number(personalBalance.toFixed(0)))
    setBasePension(basePension.toFixed(0))
    setPersonalPension(personalPension.toFixed(0))
    setPension((basePension+personalPension).toFixed(0)); // 保留两位小数
    const retireDate = new Date();
    setRetireYear(Number(retireDate.getFullYear()) +(Number(retirementAge)-Number(currentAge)))

  };
  return (
    <View >
      <View style={{ padding: 1 }}>
      <View style={stylesInline.container}>
        <Text style={{}}>工作城市：</Text>
        <View style={{ flexDirection: 'row', marginLeft:80,marginRight: 30,}}>
          <Link href="/citySelector" >{selectedCityInfo.cityName}
          <Image source={arrowImg} ></Image>
          </Link>
        </View>
      </View>
      <View style={stylesInline.container}>
        <Text style={stylesInline.label}>现在年龄:</Text>
        <TextInput style={stylesInline.input} value={currentAge} onChangeText={(text) => setCurrentAge(text)} placeholder="输入年龄" keyboardType="numeric" />
        <Text style={stylesInline.label}>退休年龄:</Text>
        <TextInput  style={stylesInline.input} value={retirementAge} onChangeText={(text) => setRetirementAge(text)} placeholder="退休年龄" keyboardType="numeric" />
      </View>
      <View style={stylesInline.container}>
        <Text style={stylesInline.label}>税前月薪: (元)</Text>
        <TextInput style={stylesInline.input} value={currentSaly}  onChangeText={(text) => onChangeCurrentSaly(text)} placeholder="输入税前月薪" keyboardType="numeric" />        
      </View>
      <View style={stylesInline.container}>        
        <Text style={stylesInline.label}>缴费基数金额: (元)</Text>
        <TextInput style={stylesInline.input} value={paymentBase} onChangeText={(text) => setPaymentBase(text)} placeholder="输入月缴费基数" keyboardType="numeric" />
      </View>
      <View style={stylesInline.container}>
        <Text style={stylesInline.label}>个人账户余额: (元)</Text>
        <TextInput style={stylesInline.input} value={currentBalance} onChangeText={(text) => setCurrentBalance(text)} placeholder="输入月缴金额" keyboardType="numeric" />
      </View>
      <View style={stylesInline.container}>
        <Text style={stylesInline.label}>已缴费年数:</Text>
        <TextInput style={stylesInline.input} value={contributedYears} onChangeText={(text) => setContributedYears(text)} placeholder="输入已缴费年数" keyboardType="numeric" />
      </View>     
      <Button title="计算到手退休金" onPress={handleCalculate} />
      {pension !== null && (
        <View>
          <View style={stylesInline.container}>
            <Text>预计退休金总额(元/月):</Text>
            <Text style={stylesInline.fontGold}>￥{pension} </Text>
          </View>
          <View style={stylesInline.container}>
            <Text>退休年份:</Text>
            <Text style={stylesInline.font}>{retireYear}年</Text>
            <Text> 基础退休金(元/月):</Text>
            <Text style={stylesInline.font}>{basePension}</Text>
          </View>  
          <View style={stylesInline.container}>
            <Text>个人账户退休金(元/月): </Text>
            <Text style={stylesInline.font}>{personalPension}</Text>
          </View>
          <View style={stylesInline.container}>
            <Text>个人缴费总额(元):</Text>
            <Text style={stylesInline.font}>{personalBalance}</Text>         
          </View>
        </View>
      )}
    </View>   
    <View style={bottomStyles.footer}>
        <Text style={bottomStyles.text}>联系|赞赏作者:ben0133@163.com</Text>
    </View>
    </View>
  );
}

const stylesInline = StyleSheet.create({
  container: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    padding: 10,
    
  },
  label: {
    marginRight: 20, // Label和Input之间的距离
  },
  input: {
    flex: 1, // TextInput占据剩余空间
    // borderWidth: 1, // 边框宽度
    // borderColor: '#ccc', // 边框颜色
    backgroundColor: '#F5FCFF', // 设置背景色
    width: 120,
    padding: 8,
    textAlign: 'right',
  },
  font:{
    color:'#000',
    fontSize:26,
    fontWeight:'bold',
    textShadowColor:'#C0C0C0',
    textShadowRadius:2,
    textShadowOffset:{width:2,height:2},
  },
  fontGold:{
    color:'#FF7700',
    fontSize:40,
    fontWeight:'bold',
    textShadowColor:'#C0C0C0',
    textShadowRadius:2,
    textShadowOffset:{width:2,height:2},
  },

  
});

const bottomStyles = StyleSheet.create({
  footer: {
    bottom: 0,
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});