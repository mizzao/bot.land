# Shared Variables

There are 5 shared variables, A-E. Bots on a team use these as follows:

-   sharedA = [x1, y1]: location of one last seen enemy
-   sharedB = [x2, y2]: location of second last seen enemy, that is not close to
    the first.
-   sharedC = [xc, yc]: team centroid, updated with an exponentially-weighted
    moving average.
-   sharedD = any[]: a state variable for each bot that it can store and retrieve.
-   sharedE = Entity[]: an Entity for each bot on the team, with the same order as
    sharedD.
