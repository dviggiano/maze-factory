import Space from '../models/space';
import Maze from '../models/maze';
import { Info } from './enums';
import { SpaceData } from '../components/maze/PlayableSpace';
import { NavigationProp } from '@react-navigation/native';
import { Tab } from './enums';

/**
 * @property {boolean} active whether the loading icon is visible
 */
export type LoadingProps = {
    active: boolean,
};

/**
 * @property {Info} info the info to display
 * @property {() => void} understand function for indicating that the user understands the info
 */
export type InfoContentProps = {
    info: Info,
    understand: () => void;
};

/**
 * @property {Space} space the corresponding maze space
 * @property {Maze} maze the corresponding maze
 * @property {SpaceData[]} allSpaces array of tracked data for all spaces of the corresponding maze
 * @property {string} color the color of the space when activated
 */
export type CanvasSpaceProps = {
    space: Space,
    maze: Maze,
    allSpaces: SpaceData[],
    color: string,
};

/**
 * @property {Maze} maze the corresponding maze
 * @property {string} color the color of the maze
 * @property {(to: string) => void} setCompletionTime function for setting the maze's completion time
 * @property {(to: boolean) => void} showModal function for enabling/disabling the completion modal's visibility
 */
export type PlayableMazeProps = {
    maze: Maze,
    color: string,
    setCompletionTime: (to: string) => void,
    showModal: (show: boolean) => void,
};

/**
 * @property {Space} space the corresponding maze space
 * @property {Maze} maze the corresponding maze
 * @property {SpaceData[]} allSpaces array of tracked data for all spaces of the corresponding maze
 * @property {string} color the color of the space when activated
 * @property {(to: string) => void} setCompletionTime function for setting the maze's completion time
 * @property {(to: boolean) => void} showModal function for enabling/disabling the completion modal's visibility
 */
export type PlayableSpaceProps = {
    space: Space,
    maze: Maze,
    setCompletionTime: (to: string) => void,
    showModal: (show: boolean) => void,
    color: string,
    allSpaces: SpaceData[],
};

/**
 * @property {Space} space the corresponding maze space
 * @property {Maze} maze the corresponding maze
 */
export type SpaceBordersProps = {
    space: Space,
    maze: Maze,
};

/**
 * @property {(boolean) => void} setLoading function for enabling/disabling the loading icon's visibility
 * @property {Tab} tab the home page's currently active tab
 */
export type BuildTabProps = {
    setLoading: (to: boolean) => void,
    tab: Tab,
};

/**
 * @property {NavigationProp<any>} navigation the app's NavigationProp
 * @property {boolean} loading the loading icon's visibility
 * @property {(to: boolean) => void} setLoading function for enabling/disabling the loading icon's visibility
 * @property {boolean} defaultResults whether the mazes loaded by default are being displayed
 * @property {(to: boolean) => void} setDefaultResults function for enabling/disabling the displaying of the mazes loaded by default
 * @property {Function} refresh function for refreshing the mazes displayed by default
 * @property {Function} fail function for indicating that loading mazes has failed
 * @property {boolean} failed whether loading mazes has failed
 * @property {Tab} tab the home page's currently active tab
 */
export type MenuTabProps = {
    navigation: NavigationProp<any>,
    loading: boolean,
    setLoading: (to: boolean) => void,
    defaultResults: boolean,
    setDefaultResults: (to: boolean) => void,
    refresh: Function,
    fail: Function,
    failed: boolean,
    tab: Tab,
};

/**
 * @property {NavigationProp<any>} navigation the app's NavigationProp
 * @property {(to: boolean) => void} setLoading function for enabling/disabling the loading icon's visibility
 * @property {Function} refresh function for refreshing the mazes displayed by default
 * @property {Function} fail function for indicating that loading mazes has failed
 * @property {Tab} tab the home page's currently active tab
 */
export type UserTabProps = {
    navigation: NavigationProp<any>,
    setLoading: (to: boolean) => void,
    refresh: Function,
    fail: Function,
    tab: Tab,
};
