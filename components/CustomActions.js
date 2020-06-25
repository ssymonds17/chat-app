import * as React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import firebase from "firebase";
import "firebase/firestore";

/**
 * @requires react
 * @requires prop-types
 * @requires react-native
 * @requires firebase
 * @requires firebase/firestore
 * @requires expo-permissions
 * @requires expo-image-picker
 * @requires expo-location
 */

export default class CustomActions extends React.Component {

 /**
  * When + is pressed actionSheet is called
  * @function onActionPress
  * @returns {actionSheet} - with options to choose from library, take photo, or send location
  */

 onActionPress = () => {
  const options = [
   'Choose From Library',
   'Take Picture',
   'Send Location',
   'Cancel'
  ];
  const cancelButtonText = options.length - 1;
  this.context.actionSheet().showActionSheetWithOptions(
   {
    options,
    cancelButtonText,
   },
   async (buttonIndex) => {
    switch (buttonIndex) {
     case 0:
      this.pickImage()
      return;
     case 1:
      this.takePhoto()
      return;
     case 2:
      this.getLocation()
      return;
     default:
    }
   },
  );
 };

 /**
  * Allows users to pick an image from camera roll storage to send
  * @async
  * @function pickImage
  */

 pickImage = async () => {
  try {
   const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
   if (status === 'granted') {
    let result = await ImagePicker.launchImageLibraryAsync({
     mediaTypes: 'Images',
    }).catch(error => console.log(error));

    if (!result.cancelled) {
     const imageUrlLink = await this.uploadImage(result.uri);
     this.props.onSend({ image: imageUrlLink });
    }
   }
  } catch (error) {
   console.log(error.message);
  }
 }

 /**
  * Allows user to take a photo and send to others
  * @async
  * @function takePhoto
  * @returns {Promise<string>} A uri sent to onSend and uploadImage
  */

 takePhoto = async () => {
  try {
   const { status } = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL);
   if (status === 'granted') {
    let result = await ImagePicker.launchCameraAsync({
     mediaTypes: 'Images',
    }).catch(error => console.log(error));

    if (!result.cancelled) {
     const imageUrlLink = await this.uploadImage(result.uri);
     this.props.onSend({ image: imageUrlLink });
    }
   }
  } catch (error) {
   console.log(error.message);
  }
 }

 /**
  * Upload the image as a blob to cloud storage
  * @async
  * @function uploadImage 
  * @param {string}
  * @returns {string} Url
  */

 uploadImage = async (uri) => {
  const blob = await new Promise((resolve, reject) => {
   const xhr = new XMLHttpRequest();
   xhr.onload = (() => {
    resolve(xhr.response);
   });
   xhr.onerror = function (e) {
    console.log(e);
    reject(new TypeError('Network request failed'));
   };
   xhr.responseType = 'blob';
   xhr.open('GET', uri, true);
   xhr.send(null);
  });

  // this will create a unique file name for each image file uploaded
  const getImageName = uri.split('/');
  const imageArrayLength = getImageName.length - 1;

  const ref = firebase.storage().ref().child(getImageName[imageArrayLength]);
  const snapshot = await ref.put(blob);

  blob.close();

  const imageURL = await snapshot.ref.getDownloadURL();
  return imageURL;
 }

 /**
  * Gets users current location
  * @async
  * @function getLocation
  */

 getLocation = async () => {
  try {
   const { status } = await Permissions.askAsync(Permissions.LOCATION);
   if (status === 'granted') {
    const result = await Location.getCurrentPositionAsync({});
    if (result) {
     this.props.onSend({
      location: {
       longitude: result.coords.longitude,
       latitude: result.coords.latitude,
      },
     });
    }
   }
  } catch (error) {
   console.log(error);
  }
 }

 render() {
  return (
   <TouchableOpacity
    style={[styles.container]}
    onPress={this.onActionPress}
   >
    <View style={[styles.wrapper, this.props.wrapperStyle]}>
     <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
    </View>
   </TouchableOpacity>
  );
 }
}

const styles = StyleSheet.create({
 container: {
  width: 26,
  height: 26,
  marginLeft: 10,
  marginBottom: 10,
 },
 wrapper: {
  borderRadius: 13,
  borderColor: '#b2b2b2',
  borderWidth: 2,
  flex: 1,
 },
 iconText: {
  color: '#b2b2b2',
  fontWeight: 'bold',
  fontSize: 16,
  backgroundColor: 'transparent',
  textAlign: 'center',
 },
});

CustomActions.contextTypes = {
 actionSheet: PropTypes.func,
};