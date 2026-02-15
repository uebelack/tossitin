import { StateGraph, START, END } from '@langchain/langgraph';
import * as z from 'zod';
import branch from '../graphs/branchGraph.mjs';

const MessagesState = z.object({});

const graph = new StateGraph(MessagesState)
  .addNode('branch', branch)
  .addEdge(START, 'branch')
  .addEdge('branch', END)
  .compile();

export default graph;
