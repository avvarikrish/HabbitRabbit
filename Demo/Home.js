/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Button,
  Alert,
  TextInput,
  Animated,
  Modal,
  DatePickerIOS,
  RefreshControl,
} from 'react-native';

import { Login } from './Login.js';
import * as Progress from 'react-native-progress';
import { NavigationContainer, } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import AppleHealthKit from 'rn-apple-healthkit';
import GoalInput from './GoalInput.js';
import Recommendation from './Recommendation.js';

navigator.geolocation = require('@react-native-community/geolocation');
const axios = require('axios');
const Stack = createStackNavigator();
const testIDs = require('./testIDs');
const PERMS = AppleHealthKit.Constants.Permissions;
const Tab = createBottomTabNavigator();
const StepGoal = 10000;
const dynamicItems = {'2021-02-17': [{name: 'February 17, 2021', score: 84.25, sleep: 7, steps: 700}]};
const sleepNumbers = [{ id: "sleep", label: "", min: 0, max: 24 }];

export class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      Steps: false,
      StepWeight: false,
      StepGoal: false,
      items: dynamicItems,
      StepProgressBar: "",
      modalVisible: false,
      Sleep: false,
      SleepWeight: false,
      SleepGoal: false,
      SleepInput: "0",
      SleepGoalInput: "",
      modalScoreVisible: false,
      CumulativeScore: false,
      refreshing: false,
      location: null,
    //   places: [],
      places: [{
            "latitude": 37.680181, 
            "longitude": -121.921498, 
            "frequency": 18, 
            "steps": 48368.7534, 
            "address": "7700 Highland Oaks Dr, Pleasanton, CA 94588, USA", 
            "time": 28080, 
            "time_str": "7 hours 48 mins"
        }, 
        {
            "latitude": 37.527237, 
            "longitude": -121.9679, 
            "frequency": 1, 
            "steps": 5724.2526, 
            "address": "4551 Carol Ave, Fremont, CA 94538, USA", 
            "time": 3254,
            "time_str": "54 mins"
        },
        {
            "latitude": 37.515014, 
            "longitude": -121.92916, 
            "frequency": 1, 
            "steps": 7253.0821000000005,
            "address": "44152 Glendora Dr, Fremont, CA 94539, USA", 
            "time": 4169, 
            "time_str": "1 hour 9 mins"
        }],
    };

    this.modalOpen = this.modalOpen.bind(this);
    this.modalClose = this.modalClose.bind(this);
    this.modalScoreOpen = this.modalScoreOpen.bind(this);
    this.modalScoreClose = this.modalScoreClose.bind(this);
    this.getAppleHealthData = this.getAppleHealthData.bind(this);
    this.getDataFromDatabase = this.getDataFromDatabase.bind(this);
    this.getAllScores = this.getAllScores.bind(this);
    this.refreshScreen = this.refreshScreen.bind(this);
    this.inputAppleHealthIntoDatabase = this.inputAppleHealthIntoDatabase.bind(this);
    this.getLocation = this.getLocation.bind(this);
    this.RecommendationScreen = this.RecommendationScreen.bind(this);
    // this.getRecommendations = this.getRecommendations.bind(this);
  }

    modalOpen() {
        this.setState({ modalVisible: true });
    }

    modalClose() {
        this.setState({ modalVisible: false });
    }

    modalScoreOpen() {
        this.setState({ modalScoreVisible: true });
    }

    modalScoreClose() {
        this.setState({ modalScoreVisible: false });
    }

    async getAppleHealthData() {
        const healthKitOptions = {
            permissions: {
                read:  [
                    PERMS.DateOfBirth,
                    PERMS.Weight,
                    PERMS.StepCount
                ]
            }
        };

        AppleHealthKit.initHealthKit(healthKitOptions, (err, results) => {
            if (err) {
            console.log("error initializing Healthkit: ", err);
            return;
            }

            AppleHealthKit.getStepCount(null, (err, results) => {
                this.setState({
                    Steps: results
                });
            })
        })
    }

    async getDataFromDatabase() {
        const url = "https://botsecure.mangocircle.com:8000/scores/get-scores";
        // const url = "http://127.0.0.1:5000/scores/get-scores";
        await axios.get(url, {
            params: {
                username: this.props.username, 
            },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.data != []){
                this.setState({Sleep: response.data[0].subscores.sleep.value, SleepWeight: response.data[0].subscores.sleep.weight, 
                    SleepGoal: response.data[0].subscores.sleep.goal, StepGoal: response.data[0].subscores.steps.goal, StepWeight: response.data[0].subscores.steps.weight,
                    CumulativeScore: response.data[0].cumulative_score,
                
                })
                console.log(response.data);
            }
        }).catch((response) => {
            console.log(response);
        })
    }

    async getAllScores() {
      const url = "https://botsecure.mangocircle.com:8000/scores/get-scores";
      await axios.get(url, {
          params: {
              username: this.props.username, 
              year: '2021'
          },
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
          }
      }).then((response) => {
          if (response.data != []){
              // this.setState({Sleep: response.data[0].subscores.sleep.value, SleepWeight: response.data[0].subscores.sleep.weight, 
              //     SleepGoal: response.data[0].subscores.sleep.goal, StepGoal: response.data[0].subscores.steps.goal, StepWeight: response.data[0].subscores.steps.weight,
              //     CumulativeScore: response.data[0].cumulative_score,
              
              // })
              var dict = {}
              for (var i = 0; i < response.data.length; i++) {
                var day = '';
                var month = '';
                if (response.data[i].day < 10) {
                  day = '0' + response.data[i].day.toString();
                }
                else {
                  day = response.data[i].day.toString();
                }
                if (response.data[i].month < 10) {
                  month = '0' + response.data[i].month.toString();
                }
                else {
                  month = response.data[i].month.toString();
                }
                var date = response.data[i].year.toString() + '-' + month + '-' + day;
                dict[date] = [{score: response.data[i].cumulative_score, sleep: response.data[i].subscores.sleep.value, sleep_goal: response.data[i].subscores.sleep.goal, steps: response.data[i].subscores.steps.value, steps_goal: response.data[i].subscores.steps.goal}];
              }
              this.setState({items: dict});
              // this.setState({items: {'2021-02-17': [{name: 'February 17, 2021', score: 44.25, sleep: 7, steps: 100}]}});
              
          }
      }).catch((response) => {
          console.log(response);
      })
  }
    async getLocation() {
        navigator.geolocation.requestAuthorization();
        navigator.geolocation.getCurrentPosition(
            position => {
                const location = JSON.stringify(position);
          
                this.setState({ location });
                console.log("ASDFASDFDSAF");
                console.log(this.state.location);
            
                const coords = JSON.parse(this.state.location).coords;
                const url = "https://botsecure.mangocircle.com:8000/index/get-locations";

                let goal = 10000;

                if (this.state.Steps && this.state.StepGoal){
                    goal = this.state.StepGoal - this.state.Steps.value;
                }
                else if (!this.state.Steps && this.state.StepGoal){
                    goal = this.state.StepGoal
                }
                console.log(goal);
                axios.get(url, {
                params: {
                    longitude: coords.longitude,
                    latitude: coords.latitude,
                    steps: goal,
                
                },
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
                })
                .then((response) => {
                    this.setState({ places: response.data });
                    console.log(response);
                })
                .catch((error) => {
                    console.log(error);
                })
            },
            error => Alert.alert(error.message),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );
    }

    // async getRecommendations() {
    //     if (this.state.location){
    //         const coords = JSON.parse(this.state.location).coords;
    //         const url = "https://botsecure.mangocircle.com:8000/index/get-locations";
    //         axios.get(url, {
    //         params: {
    //             longitude: coords.longitude,
    //             latitude: coords.latitude,
    //             steps: 1000,
            
    //         },
    //         headers: {
    //             Accept: 'application/json',
    //             'Content-Type': 'application/json'
    //         }
    //         })
    //         .then((response) => {
    //             this.setState({ places: response.data });
    //             console.log(response);
    //         })
    //         .catch((error) => {
    //             console.log(error);
    //         })
    //     }
    // }

    async componentDidMount() {
        //API calls to data base getting sleep and weights etc.
        await this.getAppleHealthData();
        await this.getDataFromDatabase();
        await this.getAllScores();
        await this.getLocation();
        // await this.getRecommendations();

        console.log(this.state);
    }

    async inputAppleHealthIntoDatabase() {
        // const url = "http://127.0.0.1:5000/scores/add-score";
        const url = "https://botsecure.mangocircle.com:8000/scores/add-score";
        const healthKitOptions = {
            permissions: {
                read:  [
                    PERMS.DateOfBirth,
                    PERMS.Weight,
                    PERMS.StepCount
                ]
            }
        };

        AppleHealthKit.initHealthKit(healthKitOptions, (err, results) => {
            if (err) {
                console.log("error initializing Healthkit: ", err);
                return;
            }

            AppleHealthKit.getStepCount(null, (err, results) => {
                this.setState({
                    Steps: results,
                    refreshing: false,
                });
                //api post request here posting it to the database
                console.log(this.state.Steps);

                if (this.state.Steps){
                    axios.post(url, {
                        username: this.props.username,
                        steps: this.state.Steps.value,
                    }).then((response) => {
                        // this.setState({ CumulativeScore: response.data.cumulative_score })
                        console.log(response.data);
                        this.setState({Sleep: response.data.subscores.sleep.value, SleepWeight: response.data.subscores.sleep.weight, 
                            SleepGoal: response.data.subscores.sleep.goal, StepGoal: response.data.subscores.steps.goal, StepWeight: response.data.subscores.steps.weight,
                            CumulativeScore: response.data.cumulative_score,
                        })
                    }).catch((response) => {
                        console.log(response);
                    })
                }
            })
        })
    }

    async refreshScreen() {
        await this.inputAppleHealthIntoDatabase();
        await this.getLocation();
        // await this.getRecommendations();
    }

    HomeScreen() {
    
        return (
            <View style = {{height: '100%'}}>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView>
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                          refreshing={this.state.refreshing}
                          onRefresh={this.refreshScreen}
                        />
                    }>
                    <View style = {styles.todayHeader}>
                        <Text style={styles.todayText}>Today</Text>
                    </View>
                    <View style = {styles.container}>
                        
                        {(this.state.CumulativeScore) !== false ?
                        <View style = {styles.todayHeader}>
                            <Text>Current Score: {this.state.CumulativeScore}</Text>
                        </View> : []
                        }
                        <View style={styles.body}>
                            <View style={styles.sectionContainer}>
                                {(this.state.Steps === 0 || this.state.Steps) ?
                                <View style = {{width: "100%"}}>
                                    <Progress.Bar style = {{width: "100%"}} progress={this.state.Steps.value/this.state.StepGoal} width={null} height={70} borderRadius={10} color={"#4287f5"}>
                                        <Text style = {styles.progressBarMainText}>Steps</Text>
                                        <Text style = {styles.progressBarSubText}>Today: {this.state.Steps.value} / {this.state.StepGoal}</Text>
                                    </Progress.Bar>
                                </View> : []
                                }
                                {(!this.state.Steps) &&
                                <Text style={styles.sectionDescriptionError}>
                                    Add your steps to Health App!
                                </Text>
                                }
                            </View>
                            <View style={styles.sectionContainer}>
                                {(this.state.Sleep !== false && this.state.SleepGoal !== false) ?
                                <View style = {{width: "100%"}}>
                                    <Progress.Bar style = {{width: "100%"}} progress={this.state.Sleep/this.state.SleepGoal} width={null} height={70} borderRadius={10} color={"#4287f5"}>
                                        <Text style = {styles.progressBarMainText}>Sleep</Text>
                                        <Text style = {styles.progressBarSubText}>Today: {this.state.Sleep} / {this.state.SleepGoal}</Text>
                                    </Progress.Bar>
                                </View> : []
                                }
                                {(this.state.Sleep === false || this.state.SleepGoal === false) ? 
                                <Text style={styles.sectionDescriptionError}>
                                    Add your sleep data to the App!
                                </Text> : []
                                }
                            </View>
                        </View>
                    </View>
                </ScrollView>
                </SafeAreaView>
            </View>
    );
  }

  InputScreen() {
      return (
        <GoalInput username = {this.props.username}/>
      );
  }

  RecommendationScreen() {
    const coords = JSON.parse(this.state.location).coords
    return (
      <Recommendation latitude = {coords.latitude} longitude = {coords.longitude} steps = {this.state.Steps} places = {this.state.places}/>
    );
}



  renderItem(item) {
    return (
      <TouchableOpacity
        testID={testIDs.agenda.ITEM}
        style={[styles.item, {height: item.height}]}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Avenir-Light',
            marginBottom: 20,
          }}
        >
          Overview
        </Text>
        <Text
          style = {{
            fontSize: 15,
            fontFamily: 'Avenir-Light',
          }}
        >
          Score
        </Text>
        <Text
          style = {{
            marginBottom: 10, 
            fontSize: 50, 
            fontFamily: 'Avenir-Light', 
            color: "#00adf5",
          }}
        >
          {item.score}
        </Text>
        <Text style = {styles.progressBarTitle}>
          Sleep
        </Text>
        <Progress.Bar style = {{width: "100%", marginBottom: 20}} progress={item.sleep/item.sleep_goal} width={null} height={20} borderRadius={10} color={"#00adf5"}>
        <Text style = {styles.progressBarTextStyle}>
            {item.sleep} / {item.sleep_goal}
          </Text>
        </Progress.Bar>
        <Text style = {styles.progressBarTitle}>
          Steps
        </Text>
        <Progress.Bar style = {{width: "100%", marginBottom: 20}} progress={item.steps/item.steps_goal} width={null} height={20} borderRadius={10} color={"#00adf5"}>
        <Text style = {styles.progressBarTextStyle}>
            {item.steps} / {item.steps_goal}
          </Text>
        </Progress.Bar>
      </TouchableOpacity>
    );
  }

  renderEmptyDate() {
    return (
      <View style={styles.emptyDate}>
            <Text style={{ color: '#cccccc', }}>
                There's nothing here
            </Text>
      </View>
    );
  }

  rowHasChanged(r1, r2) {
    return r1.name !== r2.name;
  }

  timeToString(time) {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
  }


  onDayPress(day) {
    console.log(day);
    const url = "https://botsecure.mangocircle.com:8000/scores/get-score";
    axios.get(url, {
      params: {
        username: 'a', 
        month: day.month, 
        day: day.day, 
        year: day.year,
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error);
    })
    .then(function () {
      // always executed
    });
  }


  CalendarScreen() {
    return (
      <View style={{ flex: 1}}>
          
        <Agenda 
          // testID={testIDs.agenda.CONTAINER}
          items={this.state.items}
          renderEmptyData={this.renderEmptyDate.bind(this)}
          
          // loadItemsForMonth={this.loadItems.bind(this)}
          // rowHasChanged={this.rowHasChanged.bind(this)}
          onDayPress={this.onDayPress.bind(this)}
          renderItem={this.renderItem.bind(this)}
          theme = {{
            selectedDayBackgroundColor: '#00adf5',
          }}
                
        />
      </View>
    );
  }


  render() {
    return (
        <Tab.Navigator>
          <Tab.Screen name="Home" component={this.HomeScreen.bind(this)} options={{ tabBarBadge: 3 }}/>
          <Tab.Screen name="Input" component={this.InputScreen.bind(this)} />
          <Tab.Screen name="Recommendation" component={this.RecommendationScreen.bind(this)}/>
          <Tab.Screen name="Calendar" component={this.CalendarScreen.bind(this)} />
        </Tab.Navigator>  
      );
  }
}

const styles = StyleSheet.create({
    goalInput: {
        height: "30%",
        width: "75%",
        borderBottomColor: "#024878",
        borderBottomWidth: 2,
        // marginBottom: "10%",
    },
    sleepInputModalClose: {
        alignSelf: 'flex-end',
        marginRight: '3%',
    },
    sleepInputModalPlus: {
        textAlign: 'center',
        paddingTop: 15,
        fontSize: 50,
        color: '#FFF'
    },
    sleepInputModalButtonView: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
        marginTop: "10%",
        marginRight: "3%",
    },
    sleepInputModalButton: {
        borderWidth: 2,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        alignItems: 'center',
        width: 100,
        height: 100,
        backgroundColor: '#024878',
        borderRadius: 50,
    },
    progressBarMainText: {
        position: "absolute",
        marginTop: 14,
        marginLeft: "3%",
        color: "black",
        fontSize: 20,
        fontFamily:"Avenir-Light",
    },
    progressBarSubText: {
        position: "absolute",
        marginTop: 42,
        marginLeft: "3%",
        color: "black",
        fontFamily: "Avenir-Light",
    },
    todayText: {
        fontFamily: "Avenir-Light",
        fontSize: 30,
    },
    todayHeader: {
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10
    },
    container: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        // alignItems: "center",
        height: "100%",
        // backgroundColor: "white",

    },
    progressBar: {
        flexDirection: "row",
        height: 60,
        width: "100%",
        borderWidth: 2,
        borderRadius: 20,
        borderColor: "black",

    },
    progressBarFilling: {
        borderRadius: 20, 
        backgroundColor: "#024878", 
        // width: "50%",
    },
    scrollView: {
        height: "100%",
        // backgroundColor: '#FFF',
    },
    body: {
        // backgroundColor: '#FFF',
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        width: "100%",
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: '#555',
        width: "100%",
    },
    sectionDescriptionError: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: '#A00000'
    },
    item: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        marginTop: 17
    },
    emptyDate: {
        height: 15,
        alignItems: 'center',
        flex: 1,
        paddingTop: 30
    }, 
    userInputStyle: {
      height: "5%", 
      width: "75%", 
      borderBottomColor: "#024878",
      borderBottomWidth: 2,
      marginBottom: "10%",
    },
    progressBarTextStyle: {
      position: 'absolute',
      marginTop: 2, 
      marginLeft: 10,
    }, 
    progressBarTitle: {
      fontSize: 15, 
      fontFamily: 'Avenir-Light', 
    },
    });

const Dynamic = ({ text, changeText }) => {
  return (
    <TextInput
      key="textinput1"
      style={{
        width: "100%",
        padding: 10,
        borderWidth: 1,
        marginTop: 20,
        marginBottom: 20
      }}
      onChangeText={changeText}
      value={text}
    />
  );
};

export default Home;