import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// List of all agents

export const updateWallet = async (type, betting_id, toUser, fromUser, trans_coins, game_history_id, game_id, comment, callBack) => {

    let transactionDone = 0,
        message;
    let remainingcoins, tranPossible = 0;

    if (fromUser == toUser) {

        toUser = await User.findById(toUser).populate('role').exec();

        if (toUser.role.id == 1) {
            if (toUser.coins) {
                remainingcoins = toUser.coins + trans_coins;
            } else {
                remainingcoins = trans_coins;
            }

            toUser.coins = remainingcoins;
            toUser.save();

            Transaction.create({
                type: "ADD",
                toUser: toUser._id,
                trans_coins: trans_coins,
                comment: "Coins add by Admin in own account.",
                remaining_coins: remainingcoins
            });

            transactionDone = 1;

        }
    } else if (toUser && fromUser) {

        try {

            fromUser = await User.findById(fromUser).exec();

        } catch (err) {
            message = 'Due to some technical error. Can not process your request..js';
            callBack({
                'status': transactionDone,
                'message': message
            });
        }

        if (!fromUser) {
            message = 'We can not find record by from user.js';
            callBack({
                'status': transactionDone,
                'message': message
            });
        }

        message = "Your balance is low. Please add balance to transact";

        // Check balance from user 
        if (fromUser.coins >= trans_coins) {
            message = '.js';


            try {

                // await User.findByIdAndUpdate(
                //     fromUser._id,
                //     {coins: remainingcoins}
                //   ).exec();
                remainingcoins = fromUser.coins - trans_coins;
                fromUser.coins = remainingcoins;
                fromUser.save();

                let dStatus = "SUBTRACT";
                if (type == "WITHDRAW") {
                    dStatus = "WITHDRAW";
                }
                await Transaction.create({
                    type: dStatus,
                    toUser: fromUser._id,
                    fromUser: toUser,
                    trans_coins: trans_coins,
                    comment: comment,
                    remaining_coins: remainingcoins
                });



                toUser = await User.findById(toUser).exec();

                if (toUser.coins) {
                    remainingcoins = toUser.coins + trans_coins;
                } else {
                    remainingcoins = trans_coins;
                }


                toUser.coins = remainingcoins;
                toUser.save();

                Transaction.create({
                    type: "ADD",
                    toUser: toUser._id,
                    fromUser: fromUser._id,
                    trans_coins: trans_coins,
                    comment: comment,
                    remaining_coins: remainingcoins
                });

                transactionDone = 1;

            } catch (err) {

                message = 'Due to some technical error. Can not process your request..js';
                callBack({
                    'status': transactionDone,
                    'message': message
                });

            }


        } else {
            message = 'Insuficiant Balance..js';
            callBack({
                'status': transactionDone,
                'message': message
            });
        }

    } else if (betting_id) {

        if (!fromUser) {
            fromUser = toUser;
        }

        fromUser = await User.findById(fromUser).exec();


        if (type != "ADD") {

            message = "Your balance is low. Please add balance to transact";

            // Check balance from user 
            if (fromUser.coins >= trans_coins) {
                message = '.js';

                remainingcoins = fromUser.coins - trans_coins;

                try {
                    // await User.findByIdAndUpdate(
                    //     fromUser._id,
                    //     {coins: remainingcoins}
                    //   ).exec();

                    fromUser.coins = remainingcoins;
                    fromUser.betting_points = fromUser.betting_points + trans_coins;
                    let day = new Date();
                    // day.getDay();

                    if (fromUser.play_point_update == day.getDay()) {
                        fromUser.daily_play_points += trans_coins
                    } else {
                        fromUser.daily_play_points = trans_coins;
                        fromUser.play_point_update = day.getDay();
                    }
                    await fromUser.save();

                    transactionDone = 1;
                } catch (err) {
                    message = 'Due to some technical error. Can not process your request..js';
                    return {
                        'status': transactionDone,
                        'message': message
                    };
                }
            }
        } else {
            if (fromUser.coins) {
                remainingcoins = fromUser.coins + trans_coins;
            } else {
                remainingcoins = trans_coins;
            }

            tranPossible = 1;
            try {

                fromUser.coins = remainingcoins;
                
                fromUser.profit_loss = fromUser.profit_loss + trans_coins;
                await fromUser.save();
                transactionDone = 1;

            } catch (err) {
                message = 'Due to some technical error. Can not process your request..js';
                callBack({
                    'status': transactionDone,
                    'message': err
                });
            }
        }
    } else if (betting_id == 0 && game_history_id) {

        let transactionData = {};

        if (type == "ADD") {

            let user = await User.findById(toUser, 'coins').exec();
            user.coins += trans_coins;
            user.save();

            transactionData = {
                type: "ADD",
                toUser: user._id,
                game_history_id: game_history_id,
                game_id: game_id,
                trans_coins: trans_coins,
                comment: comment,
                remaining_coins: user.coins
            }


        } else {

            let user = await User.findById(fromUser, 'coins').exec();

            transactionData = {
                type: "SUBTRACT",
                fromUser: user._id,
                game_history_id: game_history_id,
                game_id: game_id,
                trans_coins: trans_coins,
                comment: comment,
                remaining_coins: user.coins
            };
        }

        await Transaction.create(transactionData);
        transactionDone = 1;
    }

    callBack({
        'status': transactionDone,
        'message': 'Transaction done'
    });
}