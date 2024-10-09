/*
    badges.js — Custom badge configuration for comment-widget.js

    Each entry in the array below defines a badge that is shown next to
    a commenter's name when their computed tripcode matches.

    Fields per badge:
        tripcodes  — Array of computed tripcode strings that receive this badge.
                     The tripcode is the part *after* the ! shown on comments.
        name       — Label text displayed inside the badge, e.g. '## ADMIN'.
        css        — CSS class applied to the outer <span> for styling.
                     Built-in classes: c-adminBadge (red), c-modBadge (green).
                     You can add your own class in comment-widget.css.
        icon       — Path to the badge icon image. Set to '' for no icon.

    Example of a second badge:
        {
            tripcodes: ['someComputedTrip'],
            name: '## MOD',
            css:  'c-modBadge',
            icon: '/img/mod.gif',
        },
*/

const badges = [
    {
        tripcodes: ['EXAMPLE_TRIP'],
        name: '## ADMIN',
        css:  'c-adminBadge',
        icon: '/img/admin.png',
    },
    {
        tripcodes: ['EXAMPLE_GOOGLE'],
        name: 'Google Employee',
        css: 'c-googleBadge',
        icon: '/img/google.png'
    }
    // Add more badges below...
];

export default badges;
