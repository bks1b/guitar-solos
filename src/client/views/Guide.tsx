import { useContext, useEffect } from 'react';
import { MainContext, genius } from '../util';
import AuthText from '../components/AuthText';

export default () => {
    const { navigateOnClick, user } = useContext(MainContext)!;
    useEffect(() => {
        document.title = 'Guide and rules | Guitar Solos';
    }, []);
    return <>
        <h1 className='center'>Rules</h1>
        <h2>Albums and songs</h2>
        <ul>
            <li>Title case capitalization must be used for titles, unless they use a unique capitalization.</li>
            <li>Only released albums and songs are allowed to be uploaded. This is to prevent self-promotion.</li>
            <li>Different editions of albums must not be uploaded separately, and the title must not refer to any specific edition. Adding bonus tracks is allowed.</li>
            <li>Singles must belong to an individual album, unless they are featured on a deluxe edition of an album.</li>
            <li>B-sides must belong to the same album as their A-side.</li>
        </ul>
        <h2>Solos</h2>
        <ul>
            <li>There can be other instruments over guitar solos as long as the solo can be clearly heard.</li>
            <li>Vocals are only allowed over solos if they only take up a small part of the solo, and the solo can be clearly heard.</li>
            <li>Solos can contain short riffs, but must not only consist of riffs.</li>
            <li>Ratings must be integers between 0 (unlistenable) and 10 (perfect). Ratings below 5 are negative, ratings above 5 are positive.</li>
        </ul>
        <h2>Videos</h2>
        <ul>
            <li>Live recordings are only allowed if they are high quality, official recordings.</li>
            <li>YouTube videos must be high quality, music videos must not be uploaded, and the official audio must be used if it exists.</li>
        </ul>
        <h2>Album covers</h2>
        <ul>
            <li>Album covers must have an aspect ratio close to 1:1, and must be around 300px*300px. {genius} is the preferred source of album covers.</li>
            <li>NSFW album covers or album covers that might be considered weird must not be uploaded. Instead, the album cover URL field must be left empty.</li>
        </ul>
        <h1 className='center'>Guide</h1>
        {user ? '' : <AuthText text='add albums/songs/solos and rate solos'/>}
        <a>Before adding an album/song/solo, use the search feature on the top to see if it has been added.</a>
        <h2>Adding solos</h2>
        <ul>
            <li>Go to a song's page, either by using the search feature on the top, or adding a new song.</li>
            <li>Input the solo's start and end (minutes:seconds) and its guitarist(s), if known.</li>
            <li>Tick the tags which the solo matches. A solo counts as an intro or outro if there are no important parts of the song (sung vocals, solos, longer instrumental breaks) before or after it, respectively.</li>
            <li>Click "Add". You can now rate the solo.</li>
        </ul>
        <h2>Adding albums</h2>
        <ul>
            <li>Click the "Add album" button on the sidebar, type the album's name next to the "Search on Genius" button, then click the button.</li>
            <li>If the album shows up, click "Load", input the album's default genres, then click "Add". Make sure to remove the "Cover URL" field if the cover is NSFW.</li>
            <li>If the album does not show up, manually input the album's data, then click "Add".</li>
            <li>The "Default genres" of an album are the genres which most songs have. Their only purpose is to make adding songs faster by automatically completing the "Genres" field.</li>
            <li>You will get redirected to the album's page, where you can now add songs.</li>
        </ul>
        <h2>Adding songs</h2>
        <ul>
            <li>Go to an album's page, either by using the search feature on the top, or adding a new album.</li>
            <li>Input the required fields: the song's name, its genres, and its official YouTube video's URL. {genius} is a reliable source for finding a song's genres.</li>
            <li>Click "Add". You will get redirected to the song's page, where you can now add solos.</li>
        </ul>
        <h2>Filters</h2>
        <ul>
            <li>The fields at the top of certain pages ("Charts" and profiles) allow you to filter and sort the listed solos.</li>
            <li>The dropdowns next to certain fields ("Genres", "Tags" and "Guitarists") allow you to choose whether all or any of the queries must match.</li>
            <li>By typing a percent sign (%) in front of a query, you can exclude the query from the results. For example, typing "death metal; %melodic death metal" into the "Genres" field shows all death metal songs that aren't melodic death metal.</li>
            <li>The "Albums" field expects album IDs.</li>
        </ul>
        <h2>Other features</h2>
        <ul>
            <li>You can use <a className='link underline' {...navigateOnClick(['tierlist'])}>this page</a> to generate images from a given list of solos, which can be used for tier lists.</li>
        </ul>
        <div>This project is <a href='https://github.com/bks1b/guitar-solos' target='_blank'>open source.</a></div>
    </>;
};