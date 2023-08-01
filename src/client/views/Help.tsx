import { useContext, useEffect } from 'react';
import { MainContext, genius } from '../util';

export default () => {
    const { loggedIn } = useContext(MainContext)!;
    useEffect(() => {
        document.title = 'Help | Guitar Solos';
    }, []);
    return <>
        {
            loggedIn
                ? ''
                : <>
                    <a>You must be logged in to add albums/songs/solos and rate solos.</a>
                    <br/>
                </>
        }
        <a>Before adding an album/song/solo, use the search feature on the top to see if it has been added.</a>
        <h1>Adding solos</h1>
        <ul>
            <li>Go to a song's page, either by using the search feature on the top, or adding a new song.</li>
            <li>Input the solo's start and end (minutes:seconds) and its guitarist(s), if known.</li>
            <li>Click "Add". You can now rate the solo.</li>
        </ul>
        <h1>Adding albums</h1>
        <ul>
            <li>Go to the "Add album" tab on the left, and type the album's name next to the "Search on Genius" button, then click the button.</li>
            <li>If the album shows up, click "Load", then "Add". Make sure to remove the "Cover URL" field if the cover is NSFW.</li>
            <li>If the album does not show up, manually input the album's data, then click "Add".</li>
            <li>You will get redirected to the album's page, where you can now add songs.</li>
        </ul>
        <h1>Adding songs</h1>
        <ul>
            <li>Go to an album's page, either by using the search feature on the top, or adding a new album.</li>
            <li>Input the required fields: the song's name, its genres, and its official YouTube video's URL. {genius} is a reliable source for finding a song's genres.</li>
            <li>Click "Add". You will get redirected to the song's page, where you can now add solos.</li>
        </ul>
        <h1>Filters</h1>
        <ul>
            <li>The fields at the top of certain pages ("Charts" and profiles) allow you to filter and sort the listed solos.</li>
            <li>The dropdowns next to certain fields ("Genres" and "Guitarists") allow you to choose whether all or any of the queries must match.</li>
            <li>By typing a percent sign (%) in front of a query, you can exclude the query from the results. For example, typing "death metal; %melodic death metal" into the "Genres" field shows all death metal songs that aren't melodic death metal.</li>
        </ul>
    </>;
};