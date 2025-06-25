import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const APP_NAME = 'TribbleBook';
const APP_VERSION = '1.0.0';
const APP_DESCRIPTION = 'سوشيال آب هو تطبيق تواصل اجتماعي عصري يتيح لك مشاركة المنشورات والقصص، الانضمام إلى المجتمعات، والتواصل مع أصدقاء جدد بسهولة وأمان. استمتع بتجربة تفاعلية غنية وابقَ على اتصال مع كل ما يهمك في مكان واحد.';
const APP_ICON = require('../assets/images/icon.png');

export default function AppInfo() {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.iconWrapper}>
        <Image source={APP_ICON} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.appName}>{APP_NAME}</Text>
      <Text style={styles.version}>الإصدار {APP_VERSION}</Text>
      <Text style={styles.description}>{APP_DESCRIPTION}</Text>
      <View style={styles.creditsSection}>
        <Text style={styles.creditsTitle}>المطور</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/m0hamed-ux')}>
          <Text style={styles.link}>@m0hamed-ux على GitHub</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/m0hamed_ux')}>
          <Text style={styles.link}>@m0hamed_ux على Instagram</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 48,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  icon: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Rubik-Bold',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Rubik-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'Rubik-Regular',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  creditsSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  creditsTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#0095f6',
    marginBottom: 6,
    textAlign: 'center',
  },
  creditsText: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'Rubik-Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  link: {
    fontSize: 14,
    color: '#0095f6',
    fontFamily: 'Rubik-Regular',
    textDecorationLine: 'underline',
    marginBottom: 4,
    textAlign: 'center',
  },
});
