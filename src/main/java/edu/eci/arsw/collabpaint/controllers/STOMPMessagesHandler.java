package edu.eci.arsw.collabpaint.controllers;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author Leonardo Galeano
 * @author Iván Camilo Rincón Saavedra
 * @version 10/9/2021
 */
@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;
    ConcurrentHashMap<String, ArrayList<Point>> poliginos=new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        msgt.convertAndSend("/topic/newpoint."+numdibujo, pt);
        if ( poliginos.containsKey( numdibujo ) ){
            poliginos.get(numdibujo).add(pt);
            if( poliginos.get(numdibujo).size() > 3){
                msgt.convertAndSend("/topic/newpolygon."+numdibujo, poliginos.get(numdibujo));
            }
        } else {
            ArrayList<Point> points = new ArrayList<>();
            points.add(pt);
            poliginos.put(numdibujo, points);
        }
    }

    @MessageMapping("/queue.{numdibujo}")
    public void handleQueueEvent(@DestinationVariable String numdibujo) throws Exception {
        if ( poliginos.containsKey( numdibujo ) ){
            msgt.convertAndSend("/topic/queue."+numdibujo, poliginos.get(numdibujo));
        }
    }
}