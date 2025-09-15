export default class SR6SocketHandler {
    identifier = "system.shadowrun6-eden";

    registerSocketListeners() {
        game.socket.on(this.identifier, (data) => {
            console.log('SR6 | Socket Listener Event | type:', data.type);
            switch (data.type) {
                case "opponentEdgeUpdateRolls":
                    this.#opponentEdgeUpdateRolls(data);
                    break;
                case "gmUpdatesEdge":
                    this.#gmUpdatesEdge(data);
                    break;
                default:
                    throw new Error('unknown type');
            }
        });
    }

    emit(data) {
        console.log('SR6 | Socket emit | data:', data);
        return game.socket.emit(this.identifier, data);
    }

    edgeUpdateDice(userId, chatMsgId, rolls) {
        console.log('SR6 | Socket send | edgeUpdateDice send to:', game.users.get(userId).name);
        rolls = (typeof rolls === "string") ? rolls : JSON.stringify(chatMsg.rolls);
        this.emit({ 
            type: 'opponentEdgeUpdateRolls', 
            userId: userId,
            chatMsgId: chatMsgId,
            rolls: rolls 
        });
    }    

    async #opponentEdgeUpdateRolls(data) {
        console.log('SR6 | Socket message received | opponentEdgeUpdateRolls for:', game.users.get(data.userId).name);
        if (game.userId !== data.userId) return;
        console.log('SR6 | Socket processing | opponentEdgeUpdateRolls data', data);
        console.log('SR6 | Socket processing | opponentEdgeUpdateRolls rolls', JSON.parse(data.rolls));
        const chatMsg = game.messages.get(data.chatMsgId);
        await chatMsg.update({
            [`rolls`]: JSON.parse(data.rolls),
        });
    }

    updateTargetEdge(targetUuid, edgeModifier) {
        if (!game.users.activeGM) return false;
        console.log('SR6 | Socket send | updateTargetEdge requested by', game.user.name,', send to GM:', game.users.activeGM);
        this.emit({ 
            type: 'gmUpdatesEdge', 
            userId: game.user.id,
            targetUuid: targetUuid,
            edgeModifier: edgeModifier 
        });
        return true;
    };

    async #gmUpdatesEdge(data) {
        console.log('SR6 | Socket message received | gmUpdatesEdge on request of:', game.users.get(data.userId).name);
        if (game.userId !== game.users.activeGM.id) return;
        console.log('SR6 | Socket processing | gmUpdatesEdge data', data);
        const targetActor = await fromUuid(data.targetUuid);
        const newEdge = Math.max(0, Math.min(7, targetActor.system.edge.value + data.edgeModifier ));
        await targetActor.update({'system.edge.value': newEdge});
    }
}