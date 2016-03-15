const multivarka = require('./multivarka.js');

multivarka
    .server('mongodb://localhost:27017/webdev-task-2')
    .find(function (err, data) {
        if (!err) {
            console.log(data);
        }
    });

//multivarka
//    .server('mongodb://localhost:27017/webdev-task-2')
//    .collection('students')
//    .where('group').include(['ПИ-301', 'ПИ-302'])
//    .find(function (err, data) {
//        if (!err) {
//            console.log(data);
//        }
//    });

//multivarka
//    .server('mongodb://localhost:27017/webdev-task-2')
//    .collection('students')
//    .where('group').include(['КБ-301'])
//    .remove(function (err, data) {
//        if (!err) {
//            console.log(data);
//        }
//    });

//multivarka
//    .server('mongodb://localhost:27017/webdev-task-2')
//    .collection('students')
//    .where('group').include(['КБ-301'])
//    .set('group', 'ПИ-302').update(function (err, data) {
//        if (!err) {
//            console.log(data);
//        }
//});

//const petr = {
//    name: 'Пётр',
//    group: 'ПИ-303',
//    grade: 5
//};
//
//multivarka
//    .server('mongodb://localhost:27017/webdev-task-2')
//    .collection('students')
//    .insert(petr, function (err, result) {
//        if (!err) {
//            console.log(result);
//        }
//    });

