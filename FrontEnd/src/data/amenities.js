import { images } from './media';
import playImage from '../assets/media/4686c0b060c3a3f60095bcbe7fbe5aa7.jpg';
import gatherImage from '../assets/media/5d036fd7d9fb35f95288f64c3a8cb7b8.jpg';
import celebrateImage from '../assets/media/zMWWoOhN6T4YoC6TUKz2kAUwf_ANrwlcbUaPvokykrW2KB1XS2pNosVAEaVpRMtoh-iV852pr4T9ujQUYRS6p2fP_J-JMSVIQTNn3NyhM7ATk8RWcTFeDOLKaaq7tiJR8OAZHRBLocaqB7zsmAwqfB5Ero3lHenIfZk1P1ecg.jfif';

export const amenities = [
  { number: '01', title: 'Swim', desc: 'Take a refreshing break by the pool.', image: images.WA0005, objectPosition: 'center 50%', tall: true },
  { number: '02', title: 'Play', desc: 'Cricket, badminton and time outdoors.', image: playImage, objectPosition: 'center 50%', tall: false },
  { number: '03', title: 'Gather', desc: 'Enjoy evenings together on the lawns.', image: gatherImage, objectPosition: 'center 40%', tall: false },
  { number: '04', title: 'Celebrate', desc: 'Music and karaoke with your group.', image: celebrateImage, objectPosition: 'center 40%', tall: true },
];

export default amenities;
