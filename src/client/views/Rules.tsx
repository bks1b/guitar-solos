import { useEffect } from 'react';
import { genius } from '../util';

export default () => {
    useEffect(() => {
        document.title = 'Rules | Guitar Solos';
    }, []);
    return <>
        <h1>Rules</h1>
        <ul>
            <li>Albums and songs:</li>
            <ul>
                <li>Title case capitalization must be used for titles, unless they use a unique capitalization.</li>
                <li>Only released albums and songs are allowed to be uploaded. This is to prevent self-promotion.</li>
                <li>Different editions of albums must not be uploaded separately, and the title must not refer to any specific edition. Adding bonus tracks is allowed.</li>
                <li>Singles must belong to an individual album, unless they are featured on a deluxe edition of an album.</li>
                <li>B-sides must belong to the same album as their A-side.</li>
            </ul>
            <li>Solos:</li>
            <ul>
                <li>There can be other instruments over guitar solos as long as the solo can be clearly heard.</li>
                <li>Vocals are only allowed over solos if they only take up a small part of the solo, and the solo can be clearly heard.</li>
                <li>Solos can contain short riffs, but must not only consist of riffs.</li>
                <li>Ratings must be integers between 0 (unlistenable) and 10 (perfect). Ratings below 5 are negative, ratings above 5 are positive.</li>
            </ul>
            <li>Videos:</li>
            <ul>
                <li>Live recordings are only allowed if they are high quality, official recordings, and a studio recording does not exist.</li>
                <li>YouTube videos must be high quality, music videos must not be uploaded, and the official audio must be used if it exists.</li>
            </ul>
            <li>Album covers:</li>
            <ul>
                <li>Album covers must have an aspect ratio close to 1:1, and must be around 300px*300px. {genius} is the preferred source of album covers.</li>
                <li>NSFW album covers or album covers that might be considered weird must not be uploaded. Instead, the album cover URL field must be left empty.</li>
            </ul>
        </ul>
    </>;
};