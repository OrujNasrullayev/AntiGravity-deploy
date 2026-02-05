/**
 * Lesson Data from Notion Database - EXACT TIMES
 * Last Updated: 2026-02-03 02:33 UTC+4
 * All times are taken directly from the Notion Sessions database
 */

const NOTION_STUDENTS = [
    { id: "S001", pageId: "notion-ayan-id", name: "Ayan Ibrahimova", avatar: "https://ui-avatars.com/api/?name=Ayan+Ibrahimova&background=random", attendanceRate: 95 },
    { id: "S002", pageId: "notion-sevinj-id", name: "Sevinj Nasrullayeva", avatar: "https://ui-avatars.com/api/?name=Sevinj+Nasrullayeva&background=random", attendanceRate: 100 },
    { id: "S003", pageId: "notion-gullu-id", name: "Gullu Azizli", avatar: "https://ui-avatars.com/api/?name=Gullu+Azizli&background=random", attendanceRate: 88 },
    { id: "S004", pageId: "notion-zivar-id", name: "Zivar Mammadzada", avatar: "https://ui-avatars.com/api/?name=Zivar+Mammadzada&background=random", attendanceRate: 72 },
    { id: "S005", pageId: "notion-aydan-id", name: "Aydan Xammadli", avatar: "https://ui-avatars.com/api/?name=Aydan+Xammadli&background=random", attendanceRate: 92 }
];

const NOTION_GROUPS = [
    {
        id: "C001",
        name: "Conversation Club",
        type: "conversation",
        color: "#ea580c",
        studentCount: 4,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    {
        id: "P002",
        name: "Ziver's Private Lesson",
        type: "private",
        color: "#db2777",
        studentCount: 1,
        students: [NOTION_STUDENTS[3]]
    }
];

const NOTION_LESSONS = [
    // CC001 - Feb 1, 20:00 (COMPLETED)
    {
        id: "CC001",
        groupId: "C001",
        pageId: "placeholder-cc001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-01T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL002 - Feb 1, 17:00 (COMPLETED)
    {
        id: "PL002",
        groupId: "P002",
        pageId: "placeholder-pl002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-01T17:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC003 - Feb 4, 21:00
    {
        id: "CC003",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-04T21:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // CC004 - Feb 7, 20:00
    {
        id: "CC004",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-07T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL005 - Feb 7, 10:00
    {
        id: "PL005",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-07T10:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC006 - Feb 8, 20:00
    {
        id: "CC006",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-08T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL015 - Feb 8, 17:00
    {
        id: "PL015",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-08T17:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC007 - Feb 11, 21:00
    {
        id: "CC007",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-11T21:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // CC008 - Feb 14, 20:00
    {
        id: "CC008",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-14T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL016 - Feb 14, 10:00
    {
        id: "PL016",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-14T10:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC009 - Feb 15, 20:00
    {
        id: "CC009",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-15T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL017 - Feb 15, 17:00
    {
        id: "PL017",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-15T17:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC010 - Feb 18, 21:00
    {
        id: "CC010",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-18T21:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // CC011 - Feb 21, 20:00
    {
        id: "CC011",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-21T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL018 - Feb 21, 10:00
    {
        id: "PL018",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-21T10:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC012 - Feb 22, 20:00
    {
        id: "CC012",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-22T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL019 - Feb 22, 17:00
    {
        id: "PL019",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-22T17:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    },
    // CC013 - Feb 25, 21:00
    {
        id: "CC013",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-25T21:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // CC014 - Feb 28, 20:00
    {
        id: "CC014",
        groupId: "C001",
        title: "Conversation Club",
        type: "conversation",
        studentCount: 4,
        teacher: "Oruj Nasrullayev",
        color: "#ea580c",
        isoDate: "2026-02-28T20:00:00.000+04:00",
        duration: 60,
        students: [NOTION_STUDENTS[0], NOTION_STUDENTS[1], NOTION_STUDENTS[2], NOTION_STUDENTS[4]]
    },
    // PL020 - Feb 28, 10:00
    {
        id: "PL020",
        groupId: "P002",
        title: "Ziver's lesson",
        type: "private",
        studentCount: 1,
        teacher: "Oruj Nasrullayev",
        color: "#db2777",
        isoDate: "2026-02-28T10:00:00.000+04:00",
        duration: 90,
        students: [NOTION_STUDENTS[3]]
    }
];

/**
 * Helper to check if a lesson occurs on a specific date
 * @param {Date} date - The date to check
 * @returns {Array} - Array of lesson instances for that day
 */
function getLessonsForDate(date) {
    // Format target date as YYYY-MM-DD for comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dailyLessons = [];

    NOTION_LESSONS.forEach(lesson => {
        // Check if the lesson's ISO date (YYYY-MM-DD part) matches
        if (lesson.isoDate.startsWith(dateString)) {
            // Extract HH:MM from ISO string
            const timePart = lesson.isoDate.split('T')[1];
            const startTime = timePart.substring(0, 5); // "10:00"

            dailyLessons.push({
                ...lesson,
                startTime: startTime,
                duration: lesson.duration || 60,
                instanceId: `${lesson.id}-${dateString}`
            });
        }
    });

    // Sort by start time
    return dailyLessons.sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
    });
}
const NOTION_SUBMISSIONS = [
    {
        id: "2fd6f602-c1e1-803f-8186-ff3bb5977a50",
        name: "Gullu task",
        status: "Not checked",
        studentId: "2f96f602-c1e1-8098-b252-df2aa696c0d6",
        studentName: "Gullu Azizli",
        assignmentId: "2fd6f602-c1e1-80ce-8efa-d399528822d8",
        uploads: [
            {
                name: "Profile pic Believer.jpg",
                url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/fa86f602-c1e1-8179-af09-00035ae7fae1/991979f0-bb97-4b42-a20d-70a5ae250ef8/Profile_pic_Believer.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666XEEQHR5%2F20260204%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260204T185519Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFMaCXVzLXdlc3QtMiJHMEUCIQDbjbdF0yllKkgMdy7H%2BC87dFqmbvyxqht2SLXH%2F1pdpwIgTKB90oDD4MxWO%2BctQJEmQRw72LYSiS5rDY%2FykITO1XEq%2FwMIHBAAGgw2Mzc0MjMxODM4MDUiDOBJHAgbjMhoA61M8CrcA45f%2BMAcd%2BbpI5L1y%2BkCivLZAr1pi993PYxUOOzENHmQAJ5YxULTWFjn%2BFNuIdZpK8mOPfSs2N%2BvKp%2BSSDRD1fr3%2Fkb04EtX5XQe8ESHD7pwEd79dA0NMCXxtUWcwYDRy9meqmg%2Bxvtpff7UtQ6Rw%2FQZfxI9rLTyCpG%2BeegID7COynfBk8RJbjCijYVrQriGMxjDLKImyaUPr5Zpp0MjrNjIhywwXr1zENyrmrZIlh6IO6Z5PROxROkjQWKAhRh8EAZIz72Haiw9xLV65dVo0F7Q1IDyt5CLPxIYNT%2F85YfHBKU31WUeaowJ0BzFdcMlGXE1tc0ckgkBRlTYnt75nxD%2FdPbo0KqA5kjkwc%2FdgWBOEeF7zF9qPLrkPOJdnJsM29boLG%2BQ5sm9du1FU7kBAOHnrBKe%2BWajcOW4KSNL8CPEW6juGvvRx5e%2B0QxLNKvtiE5160w7FJAuIcviT%2FKaowSEx3h%2B5V2reEI6dYr9zy7iibwtzoR7OQhc61v6D%2BqklqdyQRvoLWHZN6oSLp0hzKYJCIS3rf0bzDA2AwCVzs1Mg8UfMgfxP1U5o1glZDoGa83YHVb6EVANWbDqZU0kU7aqNsbfpOIdes4%2FccSA3nDeWFmsb5pqETA3bIW6MO%2BfjswGOqUBe1hGNXI1bgay%2FjBnWeIJWNJ7XYrvKyNWXi%2F%2BhhCykz%2FmbIVMliQUrV4SQ%2FJWIIQO%2BN3j%2FMDrggfUuA2KsU4bkIVGlhQHGuJvPbP1rr20uAG7mDF38O%2BEG4p9cE%2FadA3fkA%2FcTUnPA7QicJGOhfqd8A61g%2FZiTDLskP89vNx8GjLsy3LEk8MdHSO444ph8LdSo4QgdwIuNEJ7sIBMA7osAljQPMWd&X-Amz-Signature=7bef1abb67d87e1bdf979682a830b2799c0411fa79991c71e9a8d15eef71230b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
            }
        ]
    }
];
