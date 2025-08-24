import { StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Header = ({title}) => {
  return (
    <View style={styles.Headcontainer}>
      
      <Text style={styles.Headtitle}>{title}</Text>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
    Headcontainer:{
        height:50,
        width:"100%",
        backgroundColor:"#0068ff",
        color:"#fff"
    },
    Headtitle:{
        marginTop:5,
        color:"#ffff",
        fontSize:25,
        fontWeight:"bold",
        marginLeft:10
    }
})